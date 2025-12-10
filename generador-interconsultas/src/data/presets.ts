/**
 * Presets de interconsulta por especialidad
 *
 * Proporcionan textos sugeridos para agilizar la cumplimentación
 * del formulario según el servicio destino.
 *
 * IMPORTANTE: Estos presets son recordatorios de qué información incluir,
 * NO sugerencias clínicas. El médico debe adaptar y completar según el caso.
 */

export interface SpecialtyPreset {
  /** Identificador único */
  id: string;
  /** Nombre del servicio destino (debe coincidir con los servicios configurados) */
  servicio: string;
  /** Texto sugerido para el motivo principal */
  motivoSugerido: string;
  /** Recordatorio de antecedentes a considerar */
  recordatorioAntecedentes: string;
  /** Recordatorio de datos de exploración relevantes */
  recordatorioExploracion: string;
  /** Pruebas que habitualmente se solicitan (informativo) */
  pruebasHabituales: string;
}

export const SPECIALTY_PRESETS: SpecialtyPreset[] = [
  {
    id: 'cardiologia',
    servicio: 'Cardiología',
    motivoSugerido: 'Valoración cardiológica por: [especificar síntoma/hallazgo]',
    recordatorioAntecedentes: 'Considerar incluir:\n- Factores de riesgo cardiovascular (HTA, DM, dislipemia, tabaquismo)\n- Cardiopatía previa (IAM, IC, arritmias)\n- Medicación cardiológica actual',
    recordatorioExploracion: 'Datos relevantes a incluir:\n- TA, FC\n- Auscultación cardíaca (soplos, ritmo)\n- Signos de IC (edemas, ingurgitación yugular)\n- ECG si disponible',
    pruebasHabituales: 'Pruebas que suele valorar Cardiología:\n- ECG\n- Ecocardiograma\n- Holter / MAPA\n- Ergometría',
  },
  {
    id: 'neurologia',
    servicio: 'Neurología',
    motivoSugerido: 'Valoración neurológica por: [especificar síntoma/hallazgo]',
    recordatorioAntecedentes: 'Considerar incluir:\n- Episodios previos similares\n- Antecedentes de ACV, epilepsia, migraña\n- Traumatismos craneales\n- Medicación neurológica',
    recordatorioExploracion: 'Datos relevantes a incluir:\n- Nivel de consciencia, orientación\n- Pares craneales\n- Fuerza y sensibilidad\n- Reflejos, coordinación\n- Marcha',
    pruebasHabituales: 'Pruebas que suele valorar Neurología:\n- TC/RM craneal\n- EEG\n- EMG / ENG\n- Punción lumbar (si indicada)',
  },
  {
    id: 'digestivo',
    servicio: 'Digestivo',
    motivoSugerido: 'Valoración por: [especificar síntoma GI / hallazgo analítico]',
    recordatorioAntecedentes: 'Considerar incluir:\n- Hábitos tóxicos (alcohol, tabaco)\n- Cirugías abdominales previas\n- Hepatopatía, úlcera péptica\n- Medicación gastrolesiva (AINEs)',
    recordatorioExploracion: 'Datos relevantes a incluir:\n- Abdomen: dolor, distensión, masas, ascitis\n- Hepatomegalia, esplenomegalia\n- Signos de sangrado digestivo\n- Tacto rectal si indicado',
    pruebasHabituales: 'Pruebas que suele valorar Digestivo:\n- Analítica con perfil hepático\n- Ecografía abdominal\n- Endoscopia alta/baja\n- Test de H. pylori',
  },
  {
    id: 'neumologia',
    servicio: 'Neumología',
    motivoSugerido: 'Valoración neumológica por: [especificar síntoma respiratorio]',
    recordatorioAntecedentes: 'Considerar incluir:\n- Tabaquismo (paquetes-año)\n- EPOC, asma, SAHS\n- Exposición laboral\n- Tuberculosis previa',
    recordatorioExploracion: 'Datos relevantes a incluir:\n- Frecuencia respiratoria, SatO2\n- Auscultación pulmonar\n- Uso de musculatura accesoria\n- Cianosis, acropaquias',
    pruebasHabituales: 'Pruebas que suele valorar Neumología:\n- Rx/TC tórax\n- Espirometría\n- Gasometría\n- Polisomnografía (si SAHS)',
  },
  {
    id: 'nefrologia',
    servicio: 'Nefrología',
    motivoSugerido: 'Valoración nefrológica por: [especificar alteración renal]',
    recordatorioAntecedentes: 'Considerar incluir:\n- HTA, DM (nefropatía)\n- Litiasis renal\n- Infecciones urinarias de repetición\n- Fármacos nefrotóxicos',
    recordatorioExploracion: 'Datos relevantes a incluir:\n- TA\n- Edemas\n- Puño-percusión renal\n- Globo vesical',
    pruebasHabituales: 'Pruebas que suele valorar Nefrología:\n- Función renal (Cr, FG, urea)\n- Sedimento y proteinuria\n- Ecografía renal\n- Biopsia renal (casos seleccionados)',
  },
  {
    id: 'endocrinologia',
    servicio: 'Endocrinología',
    motivoSugerido: 'Valoración endocrinológica por: [especificar alteración hormonal/metabólica]',
    recordatorioAntecedentes: 'Considerar incluir:\n- DM (tipo, años evolución, complicaciones)\n- Patología tiroidea\n- Obesidad, síndrome metabólico\n- Osteoporosis',
    recordatorioExploracion: 'Datos relevantes a incluir:\n- Peso, talla, IMC\n- Exploración tiroidea\n- Signos de Cushing, acromegalia\n- Examen de pies (si DM)',
    pruebasHabituales: 'Pruebas que suele valorar Endocrinología:\n- Perfil glucémico, HbA1c\n- Función tiroidea\n- Perfil lipídico\n- Densitometría (si osteoporosis)',
  },
  {
    id: 'reumatologia',
    servicio: 'Reumatología',
    motivoSugerido: 'Valoración reumatológica por: [especificar artropatía/conectivopatía]',
    recordatorioAntecedentes: 'Considerar incluir:\n- Artritis previas\n- Enfermedades autoinmunes\n- Psoriasis, EII\n- Uveítis',
    recordatorioExploracion: 'Datos relevantes a incluir:\n- Articulaciones afectas (número, distribución)\n- Signos inflamatorios\n- Rigidez matutina (duración)\n- Manifestaciones extraarticulares',
    pruebasHabituales: 'Pruebas que suele valorar Reumatología:\n- Reactantes de fase aguda (VSG, PCR)\n- FR, anti-CCP, ANA\n- Radiografía articular\n- Ecografía/RM articular',
  },
  {
    id: 'hematologia',
    servicio: 'Hematología',
    motivoSugerido: 'Valoración hematológica por: [especificar alteración analítica/clínica]',
    recordatorioAntecedentes: 'Considerar incluir:\n- Anemias previas\n- Sangrados, trombosis\n- Transfusiones\n- Esplenectomía',
    recordatorioExploracion: 'Datos relevantes a incluir:\n- Palidez, ictericia\n- Adenopatías\n- Hepato/esplenomegalia\n- Petequias, equimosis',
    pruebasHabituales: 'Pruebas que suele valorar Hematología:\n- Hemograma completo\n- Frotis de sangre periférica\n- Estudio de coagulación\n- Ferritina, B12, ácido fólico',
  },
];

/**
 * Obtiene el preset para un servicio destino específico
 */
export function getPresetByServicio(servicio: string): SpecialtyPreset | undefined {
  return SPECIALTY_PRESETS.find(
    p => p.servicio.toLowerCase() === servicio.toLowerCase()
  );
}

/**
 * Obtiene todos los servicios que tienen preset disponible
 */
export function getServiciosConPreset(): string[] {
  return SPECIALTY_PRESETS.map(p => p.servicio);
}
