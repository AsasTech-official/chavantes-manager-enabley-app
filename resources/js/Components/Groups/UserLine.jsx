function pickStr(...vals) {
    for (const v of vals) {
        if (v != null && String(v).trim() !== '') {
            return String(v).trim();
        }
    }
    return '';
}

function displayNameFromUser(u) {
    const fn = pickStr(u.firstName, u.firstname, u.givenName, u.given_name, u.givenname);
    const ln = pickStr(u.lastName, u.lastname, u.familyName, u.family_name, u.familyname, u.surname);
    const parts = [
        fn ? fn.toLocaleUpperCase('pt-PT') : '',
        ln ? ln.toLocaleUpperCase('pt-PT') : '',
    ].filter(Boolean);
    if (parts.length > 0) {
        return parts.join(' ');
    }
    return u.email || u.username || u.identifier;
}

export default function UserLine({ u }) {
    const label = displayNameFromUser(u);
    return (
        <li className="ml-2 list-disc text-slate-600">
            <span className="text-slate-800">{label}</span>
            <span className="ml-1 font-mono text-xs text-slate-500">({u.identifier})</span>
        </li>
    );
}
