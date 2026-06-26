<?php

namespace App\Http\Controllers;

use App\Models\IntegrationSetting;
use App\Models\Log;
use App\Services\EnableyApiService;
use App\Services\EnableyScopeService;
use App\Support\EnableyScopeContext;
use DateInterval;
use DateTimeInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Inertia\Response;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Reader\XLSX\Options as XlsxReaderOptions;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class EnableyImportController extends Controller
{
    private const MAX_DATA_ROWS = 500;

    public function __construct(
        private EnableyApiService $enabley,
        private EnableyScopeService $scopeService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Import/Index');
    }

    public function downloadTemplate(string $kind): BinaryFileResponse
    {
        return match ($kind) {
            'usuarios' => $this->xlsxDownloadResponse('modelo-usuarios.xlsx', $this->userTemplateRows()),
            default => abort(404),
        };
    }

    /**
     * @return list<list<string>>
     */
    private function userTemplateRows(): array
    {
        return [
            ['first_name', 'last_name', 'username', 'email', 'learner_groups'],
            ['MARIA', 'SILVA', '12345678909', 'maria@exemplo.com', 'Maternal, Berçário'],
        ];
    }

    /**
     * @param  list<list<string>>  $rows
     */
    private function xlsxDownloadResponse(string $downloadFilename, array $rows): BinaryFileResponse
    {
        $tmpDir = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR);
        $path = $tmpDir.DIRECTORY_SEPARATOR.'enabley_tpl_'.bin2hex(random_bytes(12)).'.xlsx';

        $writer = new XlsxWriter;
        try {
            $writer->openToFile($path);
            foreach ($rows as $row) {
                $writer->addRow(Row::fromValues($row));
            }
        } finally {
            $writer->close();
        }

        return response()->download($path, $downloadFilename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function importUsers(Request $request): RedirectResponse
    {
        $settings = IntegrationSetting::current();
        if (! $settings->hasDefaultUserPassword()) {
            return redirect()->route('import.index')->with(
                'error',
                'Defina a senha padrão no Centro de configuração antes de importar usuários.',
            );
        }

        $request->validate([
            'file' => ['required', File::types(['xlsx'])->max(10240)],
        ]);
        /** @var UploadedFile $file */
        $file = $request->file('file');

        try {
            $rows = $this->readKeyedImportRows($file, fn (string $h) => $this->normalizeUserHeaderKey($h));
        } catch (Throwable $e) {
            return redirect()->route('import.index')->with('error', $e->getMessage());
        }

        if (! isset($rows['has_first'], $rows['has_last'], $rows['has_username'])
            || ! $rows['has_first'] || ! $rows['has_last'] || ! $rows['has_username']) {
            return redirect()->route('import.index')->with(
                'error',
                'O ficheiro deve incluir as colunas first_name, last_name e username (cabeçalho na linha 1, nomes exactos).',
            );
        }

        $dataRows = $rows['rows'];
        if (count($dataRows) === 0) {
            return redirect()->route('import.index')->with('error', 'O ficheiro não tem linhas de dados.');
        }
        if (count($dataRows) > self::MAX_DATA_ROWS) {
            return redirect()->route('import.index')->with('error', 'Máximo de '.self::MAX_DATA_ROWS.' linhas por ficheiro.');
        }

        $scope = EnableyScopeContext::current();

        try {
            $flat = $this->scopeService->filterFlatGroups($this->enabley->listFlatGroups(), $scope);
        } catch (Throwable $e) {
            return redirect()->route('import.index')->with('error', $e->getMessage());
        }
        $validGroupIds = [];
        $validGroupNames = [];
        foreach ($flat as $g) {
            $id = $g['identifier'] ?? null;
            $name = $g['name'] ?? null;
            if ($id !== null && $id !== '') {
                $validGroupIds[$id] = $id;
                if ($name !== null && $name !== '') {
                    $validGroupNames[mb_strtolower(trim($name), 'UTF-8')] = $id;
                }
            }
        }

        /** @var string $password */
        $password = $settings->defaultUserPassword();

        $details = [];
        $ok = 0;
        $fail = 0;

        foreach ($dataRows as ['line' => $lineNum, 'cols' => $r]) {
            $first = mb_strtoupper(trim($r['first_name'] ?? ''), 'UTF-8');
            $last = mb_strtoupper(trim($r['last_name'] ?? ''), 'UTF-8');
            $username = trim($r['username'] ?? '');
            $emailRaw = trim((string) ($r['email'] ?? ''));
            $email = $emailRaw !== '' ? mb_strtolower($emailRaw, 'UTF-8') : null;

            if ($first === '' || $last === '' || $username === '') {
                $fail++;
                $details[] = ['line' => $lineNum, 'status' => 'error', 'message' => 'first_name, last_name e username são obrigatórios.'];

                continue;
            }
            if ($email !== null && ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $fail++;
                $details[] = ['line' => $lineNum, 'status' => 'error', 'message' => 'Email inválido.'];

                continue;
            }

            $groupIdsRaw = $this->parseCommaSeparatedIds($r['learner_groups'] ?? '');
            $groupIds = [];
            foreach ($groupIdsRaw as $val) {
                if (isset($validGroupIds[$val])) {
                    $groupIds[] = $validGroupIds[$val];
                } else {
                    $nameKey = mb_strtolower($val, 'UTF-8');
                    if (isset($validGroupNames[$nameKey])) {
                        $groupIds[] = $validGroupNames[$nameKey];
                    } else {
                        $fail++;
                        $details[] = ['line' => $lineNum, 'status' => 'error', 'message' => 'Grupo não encontrado (ID ou Nome inválido): '.$val];
                        continue 2;
                    }
                }
            }

            try {
                $created = $this->enabley->createUser(
                    firstName: $first,
                    lastName: $last,
                    username: $username,
                    email: $email,
                    address: '—',
                    possibleRoles: ['LEARNER'],
                    password: $password,
                );
                $userId = $created['identifier'] ?? '';
                if (! is_string($userId) || $userId === '') {
                    throw new RuntimeException('A API Enabley não devolveu o identificador do novo usuário.');
                }
                foreach ($groupIds as $gid) {
                    $this->enabley->assignUserToGroup($userId, $gid, false);
                }
            } catch (Throwable $e) {
                $fail++;
                $details[] = ['line' => $lineNum, 'status' => 'error', 'message' => $e->getMessage()];

                continue;
            }

            $ok++;
            $details[] = ['line' => $lineNum, 'status' => 'ok', 'identifier' => $userId, 'username' => $username];
        }

        $summary = $fail === 0
            ? "Usuários: {$ok} criados."
            : "Usuários: {$ok} criados, {$fail} falharam (ver detalhes abaixo).";

        if ($ok > 0) {
            Log::create([
                'user_id' => auth()->id(),
                'action' => 'users_imported',
                'description' => "Importou via Excel: {$ok} sucessos, {$fail} falhas.",
            ]);
        }

        return redirect()->route('import.index')
            ->with('success', $summary)
            ->with('import_users', ['ok' => $ok, 'failed' => $fail, 'rows' => $details]);
    }

    /**
     * @return array{rows: list<array{line: int, cols: array<string, string>}>, has_name: bool, has_type: bool, has_first: bool, has_last: bool, has_username: bool}
     */
    private function readKeyedImportRows(UploadedFile $file, callable $normalizeHeader): array
    {
        return $this->readKeyedSpreadsheetRows($file, $normalizeHeader);
    }

    /**
     * Primeira folha do livro; linhas vazias preservam a numeração das linhas (como no Excel).
     *
     * @return array{rows: list<array{line: int, cols: array<string, string>}>, has_name: bool, has_type: bool, has_first: bool, has_last: bool, has_username: bool}
     */
    private function readKeyedSpreadsheetRows(UploadedFile $file, callable $normalizeHeader): array
    {
        $path = $file->getRealPath();
        if ($path === false) {
            throw new RuntimeException('Ficheiro inválido.');
        }

        $options = new XlsxReaderOptions;
        $options->SHOULD_PRESERVE_EMPTY_ROWS = true;
        $options->SHOULD_FORMAT_DATES = true;

        $reader = new XlsxReader($options);
        try {
            $reader->open($path);
        } catch (Throwable $e) {
            throw new RuntimeException('Não foi possível ler o ficheiro Excel: '.$e->getMessage());
        }

        $matrix = [];
        try {
            foreach ($reader->getSheetIterator() as $sheet) {
                foreach ($sheet->getRowIterator() as $row) {
                    $matrix[] = $row->toArray();
                }

                break;
            }
        } finally {
            $reader->close();
        }

        return $this->matrixToKeyedRows($matrix, $normalizeHeader);
    }

    /**
     * @param  list<array<int|string, mixed>>  $matrix  Linha 1 = cabeçalho; índice 0 = linha 1 do ficheiro
     * @return array{rows: list<array{line: int, cols: array<string, string>}>, has_name: bool, has_type: bool, has_first: bool, has_last: bool, has_username: bool}
     */
    private function matrixToKeyedRows(array $matrix, callable $normalizeHeader): array
    {
        if ($matrix === [] || ! isset($matrix[0]) || ! is_array($matrix[0])) {
            return [
                'rows' => [],
                'has_name' => false,
                'has_type' => false,
                'has_first' => false,
                'has_last' => false,
                'has_username' => false,
            ];
        }

        $headerRow = $matrix[0];
        $normHeaders = [];
        $canonicalFlags = [];
        foreach ($headerRow as $h) {
            $hs = $this->scalarToImportString($h);
            $c = $normalizeHeader($hs);
            $normHeaders[] = $c;
            if ($c !== '') {
                $canonicalFlags[$c] = true;
            }
        }

        $rows = [];
        for ($i = 1; $i < count($matrix); $i++) {
            $values = $matrix[$i];
            if (! is_array($values)) {
                continue;
            }
            if ($this->matrixDataRowIsEmpty($values)) {
                continue;
            }
            $lineNum = $i + 1;
            $row = [];
            foreach ($normHeaders as $idx => $key) {
                if ($key === '') {
                    continue;
                }
                $row[$key] = $this->scalarToImportString($values[$idx] ?? null);
            }
            $rows[] = ['line' => $lineNum, 'cols' => $row];
        }

        return [
            'rows' => $rows,
            'has_name' => (bool) ($canonicalFlags['name'] ?? false),
            'has_type' => (bool) ($canonicalFlags['type'] ?? false),
            'has_first' => (bool) ($canonicalFlags['first_name'] ?? false),
            'has_last' => (bool) ($canonicalFlags['last_name'] ?? false),
            'has_username' => (bool) ($canonicalFlags['username'] ?? false),
        ];
    }

    private function scalarToImportString(mixed $v): string
    {
        if ($v === null) {
            return '';
        }
        if (is_string($v)) {
            return trim($v);
        }
        if (is_bool($v)) {
            return $v ? '1' : '';
        }
        if (is_int($v) || is_float($v)) {
            return trim((string) $v);
        }
        if ($v instanceof DateTimeInterface) {
            return $v->format('Y-m-d');
        }
        if ($v instanceof DateInterval) {
            return trim($v->format('%R%a days'));
        }

        return trim((string) $v);
    }

    /**
     * @param  array<int|string, mixed>  $values
     */
    private function matrixDataRowIsEmpty(array $values): bool
    {
        foreach ($values as $v) {
            if ($this->scalarToImportString($v) !== '') {
                return false;
            }
        }

        return true;
    }

    private function normalizeUserHeaderKey(string $h): string
    {
        $k = mb_strtolower(str_replace(["\xc2\xa0", ' '], '_', trim($h)), 'UTF-8');

        return match ($k) {
            'first_name' => 'first_name',
            'last_name' => 'last_name',
            'username' => 'username',
            'email' => 'email',
            'learner_groups' => 'learner_groups',
            default => '',
        };
    }

    /**
     * @return list<string>
     */
    private function parseCommaSeparatedIds(string $raw): array
    {
        if (trim($raw) === '') {
            return [];
        }
        $parts = preg_split('/[,;]+/', $raw);
        if (! is_array($parts)) {
            return [];
        }
        $out = [];
        foreach ($parts as $p) {
            if (! is_string($p)) {
                continue;
            }
            $s = trim($p);
            if ($s !== '') {
                $out[$s] = true;
            }
        }

        return array_keys($out);
    }
}
