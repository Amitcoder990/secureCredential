import { Alert, Platform } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import { Credential } from './storage';

const exportToPDF = async (credentials: Credential[]) => {
  try {

    // Mobile PDF generation
    const htmlContent = generateHTMLContent(credentials);
    const currentDate = new Date().toISOString().split('T')[0];
    const fileName = `credentials-backup-${currentDate}.pdf`;

    const options = {
      html: htmlContent,
      fileName: fileName,
      directory: Platform.OS === 'ios' ? 'Documents' : 'Downloads',
      base64: false,
      width: 612,
      height: 792,
      padding: 24,
    };

    const pdf = await RNHTMLtoPDF.convert(options);

    if (pdf.filePath) {
      // Show success alert with file location
      Alert.alert(
        'Export Successful',
        `PDF saved to ${Platform.OS === 'ios' ? 'Documents' : 'Downloads'} folder as ${fileName}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Optionally open the file or show sharing options
              // if (Platform.OS === 'ios') {
              // On iOS, you could use react-native-share to share the file
              console.log('PDF saved at:', pdf.filePath);
              // }
            }
          }
        ]
      );
      return pdf.filePath;
    } else {
      throw new Error('Failed to generate PDF');
    }
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
};


const generateHTMLContent = (credentials: Credential[]): string => {
  const currentDate = new Date().toLocaleDateString();

  const credentialRows = credentials.map(credential => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${credential.title}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${credential.username}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${credential.email || 'N/A'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${credential.phone || 'N/A'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">••••••••</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${new Date(credential.createdAt).toLocaleDateString()}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Credentials Backup - ${currentDate}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          margin: 20px;
          color: #1f2937;
          line-height: 1.4;
          font-size: 14px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 15px;
        }
        .header h1 {
          color: #3b82f6;
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: bold;
        }
        .header p {
          color: #6b7280;
          margin: 0;
          font-size: 12px;
        }
        .stats {
          display: flex;
          justify-content: space-around;
          margin-bottom: 25px;
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .stat {
          text-align: center;
          flex: 1;
        }
        .stat-number {
          font-size: 20px;
          font-weight: bold;
          color: #3b82f6;
          display: block;
        }
        .stat-label {
          font-size: 10px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }
        .security-notice {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 12px;
          margin: 15px 0;
        }
        .security-notice h3 {
          color: #92400e;
          margin: 0 0 6px 0;
          font-size: 12px;
          font-weight: bold;
        }
        .security-notice p {
          color: #92400e;
          margin: 0;
          font-size: 10px;
          line-height: 1.3;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }
        th {
          background: #3b82f6;
          color: white;
          padding: 10px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        td {
          font-size: 10px;
          word-break: break-word;
        }
        tr:nth-child(even) {
          background: #f9fafb;
        }
        .footer {
          margin-top: 25px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 10px;
        }
        .footer p {
          margin: 2px 0;
        }
        
        /* Mobile optimizations */
        @media screen and (max-width: 600px) {
          body { margin: 15px; font-size: 12px; }
          .header h1 { font-size: 20px; }
          .stats { flex-direction: column; gap: 10px; }
          .stat { margin-bottom: 8px; }
          th, td { padding: 8px 6px; font-size: 9px; }
          .stat-number { font-size: 16px; }
        }
        
        /* Print optimizations */
        @media print {
          body { margin: 15px; }
          .header { page-break-after: avoid; }
          table { page-break-inside: avoid; }
          .security-notice { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔐 Credentials Backup</h1>
        <p>Generated on ${currentDate}</p>
      </div>
      
      <div class="stats">
        <div class="stat">
          <span class="stat-number">${credentials.length}</span>
          <div class="stat-label">Total Credentials</div>
        </div>
        <div class="stat">
          <span class="stat-number">${credentials.filter(c => c.email).length}</span>
          <div class="stat-label">With Email</div>
        </div>
        <div class="stat">
          <span class="stat-number">${credentials.filter(c => c.phone).length}</span>
          <div class="stat-label">With Phone</div>
        </div>
      </div>

      <div class="security-notice">
        <h3>⚠️ Security Notice</h3>
        <p>This document contains sensitive information. Passwords are masked for security. Store this backup in a secure location and delete it after use if no longer needed.</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Username</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Password</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${credentialRows}
        </tbody>
      </table>

      <div class="footer">
        <p><strong>Secure Credentials App</strong></p>
        <p>Backup generated on ${currentDate}</p>
        <p>Total records: ${credentials.length} | Keep this document secure</p>
      </div>
    </body>
    </html>
  `;
};

export const pdfExportService = {
  exportToPDF,
};