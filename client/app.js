const url = 'https://rl.digitalcaldwell.com';
const currentHref = window.location.href;

if (!currentHref.includes('localhost')) {
    if (currentHref.includes('http:')) {
        window.location.href = url;
    }
}