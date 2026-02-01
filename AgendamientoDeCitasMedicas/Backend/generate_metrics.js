const fs = require('fs');
const path = require('path');

/**
 * Script para generar métricas del código fuente
 * Genera un reporte JSON con estadísticas del proyecto
 */

// Función para contar líneas de código
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const codeLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*');
    });
    return {
      total: lines.length,
      code: codeLines.length,
      comments: lines.length - codeLines.length,
    };
  } catch (error) {
    return { total: 0, code: 0, comments: 0 };
  }
}

// Función para contar funciones
function countFunctions(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|async\s+function/g);
    return functionMatches ? functionMatches.length : 0;
  } catch (error) {
    return 0;
  }
}

// Función recursiva para escanear directorios
function scanDirectory(dir, stats, extensions = ['.js']) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== 'coverage' && file !== 'build' && file !== '.git') {
          scanDirectory(filePath, stats, extensions);
        }
      } else if (extensions.some(ext => file.endsWith(ext))) {
        const lines = countLines(filePath);
        const functions = countFunctions(filePath);
        
        stats.files++;
        stats.totalLines += lines.total;
        stats.codeLines += lines.code;
        stats.commentLines += lines.comments;
        stats.totalFunctions += functions;
        
        // Clasificar por tipo
        if (filePath.includes('/controllers/')) {
          stats.controllers++;
        } else if (filePath.includes('/models/')) {
          stats.models++;
        } else if (filePath.includes('/routes/')) {
          stats.routes++;
        } else if (filePath.includes('/services/')) {
          stats.services++;
        } else if (filePath.includes('/tests/') || file.startsWith('test_')) {
          stats.testFiles++;
        } else if (file.includes('.test.') || file.includes('.spec.')) {
          stats.testFiles++;
        }
      }
    });
  } catch (error) {
    console.error(`Error escaneando directorio ${dir}:`, error.message);
  }
}

// Función principal
function generateMetrics() {
  console.log('🔍 Generando métricas del código...\n');
  
  const stats = {
    files: 0,
    totalLines: 0,
    codeLines: 0,
    commentLines: 0,
    totalFunctions: 0,
    controllers: 0,
    models: 0,
    routes: 0,
    services: 0,
    testFiles: 0,
  };
  
  // Escanear directorio src/
  const srcDir = path.join(__dirname, 'src');
  if (fs.existsSync(srcDir)) {
    scanDirectory(srcDir, stats);
  }
  
  // Escanear archivos de test en raíz
  const rootFiles = fs.readdirSync(__dirname);
  rootFiles.forEach(file => {
    if (file.endsWith('.js') && (file.startsWith('test_') || file.includes('.test.'))) {
      const filePath = path.join(__dirname, file);
      const lines = countLines(filePath);
      const functions = countFunctions(filePath);
      
      stats.testFiles++;
      stats.files++;
      stats.totalLines += lines.total;
      stats.codeLines += lines.code;
      stats.commentLines += lines.comments;
      stats.totalFunctions += functions;
    }
  });
  
  // Calcular métricas derivadas
  stats.avgLinesPerFile = stats.files > 0 ? Math.round(stats.totalLines / stats.files) : 0;
  stats.avgFunctionsPerFile = stats.files > 0 ? Math.round(stats.totalFunctions / stats.files) : 0;
  stats.commentRatio = stats.totalLines > 0 ? 
    ((stats.commentLines / stats.totalLines) * 100).toFixed(2) : 0;
  
  // Generar timestamp
  stats.generatedAt = new Date().toISOString();
  
  // Guardar en archivo JSON
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const outputPath = path.join(reportsDir, 'code-metrics.json');
  fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2));
  
  // Mostrar resumen en consola
  console.log('📊 MÉTRICAS DEL CÓDIGO');
  console.log('═'.repeat(50));
  console.log(`Total de archivos:        ${stats.files}`);
  console.log(`Líneas totales:           ${stats.totalLines}`);
  console.log(`Líneas de código:         ${stats.codeLines}`);
  console.log(`Líneas de comentarios:    ${stats.commentLines}`);
  console.log(`Ratio de comentarios:     ${stats.commentRatio}%`);
  console.log(`Total de funciones:       ${stats.totalFunctions}`);
  console.log(`Promedio líneas/archivo:  ${stats.avgLinesPerFile}`);
  console.log(`Promedio funciones/arch:  ${stats.avgFunctionsPerFile}`);
  console.log('─'.repeat(50));
  console.log(`Controllers:              ${stats.controllers}`);
  console.log(`Models:                   ${stats.models}`);
  console.log(`Routes:                   ${stats.routes}`);
  console.log(`Services:                 ${stats.services}`);
  console.log(`Test files:               ${stats.testFiles}`);
  console.log('═'.repeat(50));
  console.log(`\n✅ Reporte guardado en: ${outputPath}\n`);
  
  return stats;
}

// Ejecutar
if (require.main === module) {
  generateMetrics();
}

module.exports = { generateMetrics, countLines, countFunctions };
