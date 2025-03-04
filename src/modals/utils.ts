export function constructModalTitle(container: HTMLElement, text: string) {
  const title = container.createEl('h2', {
    text: text
  });
  Object.assign(title.style, {
    margin: '0 0 1rem 0',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    textAlign: 'center',
  });
  return title;
}