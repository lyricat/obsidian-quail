export function constructModalTitle(title: string) {
    const div = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.appendText(title);
    h2.style.fontSize = '1rem';
    h2.style.textAlign = 'center';
    div.appendChild(h2);
    div.style.marginBottom = '16px';
    return div;
}