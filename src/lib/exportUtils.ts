import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export interface ExportData {
  title: string;
  data: any[];
  columns: { key: string; label: string }[];
}

export const exportToExcel = (exportData: ExportData) => {
  const { title, data, columns } = exportData;

  // Créer les en-têtes
  const headers = columns.map((col) => col.label);

  // Créer les lignes de données
  const rows = data.map((item) =>
    columns.map((col) => item[col.key] ?? "")
  );

  // Créer la feuille de calcul
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Ajuster la largeur des colonnes
  const colWidths = columns.map((col) => ({
    wch: Math.max(
      col.label.length,
      ...data.map((item) => String(item[col.key] ?? "").length)
    ),
  }));
  ws["!cols"] = colWidths;

  // Créer le classeur
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title);

  // Générer le fichier
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Télécharger le fichier
  saveAs(blob, `${title}_${new Date().toISOString().split("T")[0]}.xlsx`);
};

export const exportToPDF = async (exportData: ExportData) => {
  const { title, data, columns } = exportData;

  // Créer le contenu HTML pour le PDF
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
        }
        h1 {
          color: #333;
          border-bottom: 2px solid #4F46E5;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #4F46E5;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: bold;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        tr:hover {
          background-color: #f5f5f5;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Généré le ${new Date().toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}</p>
      <table>
        <thead>
          <tr>
            ${columns.map((col) => `<th>${col.label}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (item) => `
            <tr>
              ${columns
                .map((col) => `<td>${item[col.key] ?? "-"}</td>`)
                .join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      <div class="footer">
        <p>FleetManager - Rapport généré automatiquement</p>
      </div>
    </body>
    </html>
  `;

  // Ouvrir une nouvelle fenêtre avec le contenu HTML
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

export const formatCurrency = (value: number): string => {
  return `${value.toFixed(2)} TND`;
};

export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};
