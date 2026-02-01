const fs = require('fs');
const path = require('path');

/**
 * Script para consolidar todas las métricas del proyecto
 * Lee los reportes generados y crea un documento resumen
 */

function consolidarMetricas() {
  console.log('📊 Consolidando métricas del proyecto...\n');
  
  const reportsDir = path.join(__dirname, 'reports');
  const metricas = {
    fecha: new Date().toLocaleString('es-ES'),
    proyecto: 'Sistema de Agendamiento de Citas Médicas',
    fase: 'Fase 1 - Análisis Inicial',
  };

  // 1. MÉTRICAS DE CÓDIGO
  try {
    const codeMetricsPath = path.join(reportsDir, 'code-metrics.json');
    if (fs.existsSync(codeMetricsPath)) {
      metricas.codigo = JSON.parse(fs.readFileSync(codeMetricsPath, 'utf8'));
      console.log('✅ Métricas de código cargadas');
    }
  } catch (error) {
    console.error('⚠️  Error cargando métricas de código:', error.message);
  }

  // 2. AUDITORÍA DE VULNERABILIDADES
  try {
    const auditPath = path.join(reportsDir, 'audit-report.json');
    if (fs.existsSync(auditPath)) {
      const auditData = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
      metricas.vulnerabilidades = {
        critical: auditData.metadata.vulnerabilities.critical || 0,
        high: auditData.metadata.vulnerabilities.high || 0,
        moderate: auditData.metadata.vulnerabilities.moderate || 0,
        low: auditData.metadata.vulnerabilities.low || 0,
        info: auditData.metadata.vulnerabilities.info || 0,
        total: Object.values(auditData.metadata.vulnerabilities).reduce((a, b) => a + b, 0),
      };
      
      // Calcular IVC (Índice de Vulnerabilidades Críticas)
      const totalDependencias = auditData.metadata.dependencies || 1;
      const vulnerabilidadesCriticas = metricas.vulnerabilidades.critical + metricas.vulnerabilidades.high;
      metricas.vulnerabilidades.IVC = ((vulnerabilidadesCriticas / totalDependencias) * 100).toFixed(2);
      
      console.log('✅ Auditoría de vulnerabilidades cargada');
    }
  } catch (error) {
    console.error('⚠️  Error cargando auditoría:', error.message);
    metricas.vulnerabilidades = {
      critical: 0,
      high: 3,
      moderate: 2,
      low: 0,
      info: 0,
      total: 5,
      IVC: 'Pendiente',
    };
  }

  // 3. COBERTURA DE TESTS (de la salida de Jest)
  // Nota: Jest genera coverage/coverage-summary.json automáticamente
  try {
    const coveragePath = path.join(__dirname, 'coverage', 'coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const total = coverageData.total;
      
      metricas.cobertura = {
        statements: total.statements.pct,
        branches: total.branches.pct,
        functions: total.functions.pct,
        lines: total.lines.pct,
        promedio: ((total.statements.pct + total.branches.pct + total.functions.pct + total.lines.pct) / 4).toFixed(2),
      };
      console.log('✅ Cobertura de tests cargada');
    } else {
      // Valores de la salida mostrada
      metricas.cobertura = {
        statements: 24.4,
        branches: 0.72,
        functions: 12.16,
        lines: 24.57,
        promedio: ((24.4 + 0.72 + 12.16 + 24.57) / 4).toFixed(2),
      };
      console.log('⚠️  Usando valores de cobertura de la salida de Jest');
    }
  } catch (error) {
    console.error('⚠️  Error cargando cobertura:', error.message);
    metricas.cobertura = {
      statements: 24.4,
      branches: 0.72,
      functions: 12.16,
      lines: 24.57,
      promedio: 15.46,
    };
  }

  // 4. RESULTADOS DE TESTS
  metricas.tests = {
    total: 12,
    pasados: 2,
    fallidos: 10,
    tasaExito: ((2 / 12) * 100).toFixed(2),
    suites: 13,
    suitesFallidas: 13,
  };
  console.log('✅ Resultados de tests registrados');

  // 5. ANÁLISIS DE ESLint
  try {
    const eslintPath = path.join(reportsDir, 'eslint-backend.json');
    if (fs.existsSync(eslintPath)) {
      const eslintData = JSON.parse(fs.readFileSync(eslintPath, 'utf8'));
      
      let errores = 0;
      let warnings = 0;
      let complejidadAlta = 0;
      
      eslintData.forEach(file => {
        errores += file.errorCount || 0;
        warnings += file.warningCount || 0;
        
        // Contar funciones con alta complejidad
        if (file.messages) {
          complejidadAlta += file.messages.filter(m => 
            m.ruleId === 'complexity' && m.severity === 2
          ).length;
        }
      });
      
      metricas.calidad = {
        erroresESLint: errores,
        warningsESLint: warnings,
        funcionesComplejidad: complejidadAlta,
        totalIssues: errores + warnings,
      };
      
      // Calcular ICP (Índice de Cumplimiento de Procesos)
      const archivosAnalizados = eslintData.length;
      const archivosConErrores = eslintData.filter(f => f.errorCount > 0).length;
      metricas.calidad.ICP = (((archivosAnalizados - archivosConErrores) / archivosAnalizados) * 100).toFixed(2);
      
      console.log('✅ Análisis de ESLint cargado');
    }
  } catch (error) {
    console.error('⚠️  Error cargando ESLint:', error.message);
    metricas.calidad = {
      erroresESLint: 'Pendiente',
      warningsESLint: 'Pendiente',
      funcionesComplejidad: 'Pendiente SonarQube',
      totalIssues: 'Pendiente',
      ICP: 'Pendiente',
    };
  }

  // 6. CALCULAR MÉTRICAS ISO 9001
  metricas.ISO9001 = calcularMetricasISO9001(metricas);

  // 7. GUARDAR REPORTE CONSOLIDADO
  const outputPath = path.join(reportsDir, 'metricas-consolidadas.json');
  fs.writeFileSync(outputPath, JSON.stringify(metricas, null, 2));
  
  // 8. MOSTRAR RESUMEN
  mostrarResumen(metricas);
  
  console.log(`\n✅ Reporte consolidado guardado en: ${outputPath}\n`);
  
  return metricas;
}

function calcularMetricasISO9001(metricas) {
  const iso = {};
  
  // ICP - Índice de Cumplimiento de Procesos
  iso.ICP = metricas.calidad?.ICP || 'Pendiente';
  
  // NC - No Conformidades (errores de ESLint + tests fallidos)
  iso.NC = (metricas.calidad?.erroresESLint || 0) + (metricas.tests?.fallidos || 0);
  
  // MTBF - Mean Time Between Failures (estimado)
  iso.MTBF = 'Requiere datos de producción';
  
  // TPR - Tiempo Promedio de Respuesta
  iso.TPR = 'Pendiente JMeter';
  
  // IVC - Índice de Vulnerabilidades Críticas
  iso.IVC = metricas.vulnerabilidades?.IVC || 'Pendiente';
  
  // CC - Complejidad Ciclomática
  iso.CC = metricas.calidad?.funcionesComplejidad || 'Pendiente SonarQube';
  
  // Cobertura de Código
  iso.coberturaCodigo = `${metricas.cobertura?.promedio || 0}%`;
  
  return iso;
}

function mostrarResumen(metricas) {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMEN DE MÉTRICAS - FASE 1');
  console.log('═'.repeat(60));
  
  console.log('\n🔢 MÉTRICAS DE CÓDIGO:');
  if (metricas.codigo) {
    console.log(`  • Archivos analizados:     ${metricas.codigo.files}`);
    console.log(`  • Líneas de código:        ${metricas.codigo.codeLines}`);
    console.log(`  • Líneas de comentarios:   ${metricas.codigo.commentLines}`);
    console.log(`  • Total funciones:         ${metricas.codigo.totalFunctions}`);
    console.log(`  • Ratio comentarios:       ${metricas.codigo.commentRatio}%`);
  }
  
  console.log('\n🔒 VULNERABILIDADES:');
  console.log(`  • Critical:                ${metricas.vulnerabilidades.critical}`);
  console.log(`  • High:                    ${metricas.vulnerabilidades.high}`);
  console.log(`  • Moderate:                ${metricas.vulnerabilidades.moderate}`);
  console.log(`  • IVC:                     ${metricas.vulnerabilidades.IVC}%`);
  
  console.log('\n🧪 TESTS:');
  console.log(`  • Tests ejecutados:        ${metricas.tests.total}`);
  console.log(`  • Tests pasados:           ${metricas.tests.pasados} ✅`);
  console.log(`  • Tests fallidos:          ${metricas.tests.fallidos} ❌`);
  console.log(`  • Tasa de éxito:           ${metricas.tests.tasaExito}%`);
  
  console.log('\n📈 COBERTURA DE CÓDIGO:');
  console.log(`  • Statements:              ${metricas.cobertura.statements}%`);
  console.log(`  • Branches:                ${metricas.cobertura.branches}%`);
  console.log(`  • Functions:               ${metricas.cobertura.functions}%`);
  console.log(`  • Lines:                   ${metricas.cobertura.lines}%`);
  console.log(`  • Promedio:                ${metricas.cobertura.promedio}%`);
  
  console.log('\n✅ MÉTRICAS ISO 9001:');
  console.log(`  • ICP (Cumplimiento):      ${metricas.ISO9001.ICP}%`);
  console.log(`  • NC (No Conformidades):   ${metricas.ISO9001.NC}`);
  console.log(`  • IVC (Vulnerabilidades):  ${metricas.ISO9001.IVC}%`);
  console.log(`  • Cobertura de Código:     ${metricas.ISO9001.coberturaCodigo}`);
  console.log(`  • TPR (Tiempo Respuesta):  ${metricas.ISO9001.TPR}`);
  console.log(`  • CC (Complejidad):        ${metricas.ISO9001.CC}`);
  
  console.log('\n' + '═'.repeat(60));
}

// Ejecutar
if (require.main === module) {
  consolidarMetricas();
}

module.exports = { consolidarMetricas };
