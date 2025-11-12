/**
 * Utility to prevent duplicate analysis saves
 * Utilidad para prevenir guardado duplicado de análisis
 */

class AnalysisSaveManager {
  constructor() {
    this.isSaving = false;
    this.lastSaveTime = null;
    this.lastSaveData = null;
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
    /**
   * Guarda un análisis de forma segura evitando duplicados
   * @param {Object} analysisData - Datos del análisis a guardar
   * @param {Function} saveFunction - Función para guardar el análisis
   * @returns {Promise<Object>} - Resultado del guardado
   */
  async saveAnalysisSafe(analysisData, saveFunction) {
    // Prevenir múltiples guardados concurrentes
    if (this.isSaving) {
      console.log('⚠️ Ya hay un guardado en progreso, ignorando...');
      return { success: false, message: 'Guardado en progreso' };
    }

    // Verificar si es un duplicado muy reciente (últimos 5 segundos)
    const now = Date.now();
    const timeSinceLastSave = this.lastSaveTime ? now - this.lastSaveTime : Infinity;
    
    if (timeSinceLastSave < 5000 && this.isDuplicateData(analysisData)) {
      console.log('⚠️ Datos duplicados detectados, ignorando guardado');
      return { success: false, message: 'Datos duplicados' };
    }

    try {
      this.isSaving = true;
      console.log('💾 Iniciando guardado seguro de análisis...');
      
      const result = await saveFunction(analysisData);
      
      // Actualizar información de último guardado
      this.lastSaveTime = now;
      this.lastSaveData = { ...analysisData };
      
      console.log('✅ Análisis guardado exitosamente');
      return result;
      
    } catch (error) {
      console.error('❌ Error en guardado seguro:', error);
      throw error;
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Verifica si los datos son duplicados del último guardado
   * @param {Object} newData - Nuevos datos a comparar
   * @returns {boolean} - True si son duplicados
   */
  isDuplicateData(newData) {
    if (!this.lastSaveData) return false;

    // Comparar campos clave para detectar duplicados
    return (
      this.lastSaveData.emotion === newData.emotion &&
      Math.abs(this.lastSaveData.confidence - newData.confidence) < 0.01 &&
      JSON.stringify(this.lastSaveData.emotions_detected) === JSON.stringify(newData.emotions_detected)
    );
  }

  /**
   * Resetea el estado del manager
   */
  reset() {
    this.isSaving = false;
    this.lastSaveTime = null;
    this.lastSaveData = null;
  }
}

// Crear una instancia singleton
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