/**
 * Utility to prevent duplicate analysis saves
 * Utilidad para prevenir guardado duplicado de análisis
 */

class AnalysisSaveManager {
  constructor() {
    this.savedAnalyses = new Set();
    this.pendingSaves = new Set();
  }

  /**
   * Genera un hash único para un análisis basado en sus datos principales
   */
  generateAnalysisHash(analysisData) {
    const { emotion, confidence, timestamp } = analysisData;
    const roundedConfidence = Math.round(confidence * 100) / 100; // 2 decimales
    const timeWindow = Math.floor(timestamp / 30000); // Ventana de 30 segundos
    return `${emotion}_${roundedConfidence}_${timeWindow}`;
  }

  /**
   * Verifica si un análisis ya fue guardado recientemente
   */
  isAlreadySaved(analysisData) {
    const hash = this.generateAnalysisHash(analysisData);
    return this.savedAnalyses.has(hash) || this.pendingSaves.has(hash);
  }

  /**
   * Marca un análisis como guardado
   */
  markAsSaved(analysisData) {
    const hash = this.generateAnalysisHash(analysisData);
    this.savedAnalyses.add(hash);
    this.pendingSaves.delete(hash);
    
    // Limpiar entradas antigas después de 5 minutos
    setTimeout(() => {
      this.savedAnalyses.delete(hash);
    }, 5 * 60 * 1000);
  }

  /**
   * Marca un análisis como pendiente de guardado
   */
  markAsPending(analysisData) {
    const hash = this.generateAnalysisHash(analysisData);
    this.pendingSaves.add(hash);
    
    // Limpiar pendientes después de 1 minuto (timeout)
    setTimeout(() => {
      this.pendingSaves.delete(hash);
    }, 60 * 1000);
  }

  /**
   * Guarda un análisis de manera segura sin duplicados
   */
  async saveAnalysisSafe(analysisData, saveFunction) {
    const dataWithTimestamp = {
      ...analysisData,
      timestamp: Date.now()
    };

    // Verificar si ya está guardado o pendiente
    if (this.isAlreadySaved(dataWithTimestamp)) {
      console.log('⚠️ Análisis ya guardado o pendiente, omitiendo...');
      return { success: true, message: 'Analysis already saved' };
    }

    // Marcar como pendiente
    this.markAsPending(dataWithTimestamp);

    try {
      // Ejecutar función de guardado
      const result = await saveFunction(dataWithTimestamp);
      
      // Marcar como guardado exitosamente
      this.markAsSaved(dataWithTimestamp);
      
      console.log('✅ Análisis guardado exitosamente');
      return result;
      
    } catch (error) {
      // Remover de pendientes en caso de error
      const hash = this.generateAnalysisHash(dataWithTimestamp);
      this.pendingSaves.delete(hash);
      
      console.error('❌ Error guardando análisis:', error);
      throw error;
    }
  }
}

// Instancia singleton
const analysisSaveManager = new AnalysisSaveManager();

export default analysisSaveManager;

/**
 * Hook de React para guardar análisis de manera segura
 */
export const useSafeAnalysisSave = () => {
  const saveAnalysisSafe = async (analysisData, saveFunction) => {
    return analysisSaveManager.saveAnalysisSafe(analysisData, saveFunction);
  };

  return { saveAnalysisSafe };
};