export const buildCSV = (data: any[]): string => {
  if (!data || data.length === 0) return '';
  const keys = Object.keys(data[0]);
  const header = keys.join(',');
  const rows = data.map(row => keys.map(k => `"${row[k]}"`).join(','));
  return [header, ...rows].join('\n');
};

export const buildReportHTML = (title: string, data: any[]): string => {
  if (!data || data.length === 0) return `<h1>${title}</h1><p>No data available.</p>`;
  const keys = Object.keys(data[0]);
  
  const ths = keys.map(k => `<th>${k}</th>`).join('');
  const trs = data.map(row => {
    const tds = keys.map(k => `<td>${row[k]}</td>`).join('');
    return `<tr>${tds}</tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background-color: #f4f4f4; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <table>
    <thead><tr>${ths}</tr></thead>
    <tbody>${trs}</tbody>
  </table>
</body>
</html>`;
};
