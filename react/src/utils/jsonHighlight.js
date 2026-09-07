/* Colored JSON preview — ported from the legacy prototype's renderJsonPreview()
   (finance-and-accounting-main/pas-policy.html). Returns an HTML string with
   .json-key / .json-string / .json-number / .json-boolean / .json-value spans;
   render it via dangerouslySetInnerHTML inside a .json-preview-container. */
export function highlightJson(value) {
  const jsonStr = JSON.stringify(value, null, 2) ?? '';

  return jsonStr
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-string';
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-value';
      }
      return `<span class="${cls}">${match}</span>`;
    });
}
