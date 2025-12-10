# Generador de Interconsultas

**SaaS profesional para la generación de borradores de documentos clínicos**

Una herramienta diseñada para médicos de atención primaria y hospitalaria que necesitan generar documentos de interconsulta, informes de alta, peticiones de pruebas y más, de forma rápida y estructurada.

## Descripción

Los médicos dedican una cantidad significativa de tiempo a rellenar interconsultas y derivaciones, repitiendo estructuras similares múltiples veces al día. Este generador automatiza la creación del documento estructurado, permitiendo al profesional centrarse en el contenido clínico relevante.

### Características principales

**Generación de documentos**
- **Multi-documento**: Soporte para 5 tipos de documentos (Interconsulta, Informe de Alta, Petición de Pruebas, Nota Evolutiva, Informe Social)
- **Formulario estructurado**: Campos organizados por secciones
- **Vista profesional A4**: Previsualización del documento con formato de página real
- **Presets por especialidad**: Plantillas predefinidas para Cardiología, Neurología, Digestivo, etc.

**Productividad premium**
- **Modo Consulta Rápida**: Layout simplificado con solo campos esenciales (toggle con Ctrl+M)
- **Auto-generación**: Genera borrador automáticamente cuando los campos tienen >30 caracteres
- **Frases Rápidas**: Biblioteca de frases predefinidas insertables con un clic
- **Multi-documento wizard**: Reutiliza datos del paciente para generar varios documentos
- **Checklist de revisión**: Listas de verificación por servicio (Cardiología, Neurología, etc.)
- **Analítica de uso**: Estadísticas de productividad y tiempo ahorrado

**Mejora con IA**
- **Mejora de redacción**: Usando OpenAI (no modifica contenido clínico)
- **Modos de IA**: Mejorar redacción, formatear o resumir texto
- **Comparación de cambios**: Vista diff mostrando qué modificó la IA

**Personalización**
- **Branding por centro**: Nombre, logo y colores de tu clínica
- **Plantillas configurables**: Sistema de plantillas con placeholders
- **Servicios editables**: Lista de especialidades médicas configurable
- **Dark mode**: Soporte completo para modo oscuro

**Integraciones**
- **Webhooks**: Envía documentos a n8n, Zapier, Make u otros servicios
- **Historial local**: Acceso a documentos recientes
- **Impresión optimizada**: Botón de imprimir con estilos @media print

**Atajos de teclado**
| Atajo | Acción |
|-------|--------|
| `Ctrl+Enter` | Generar documento |
| `Ctrl+M` | Toggle Modo Rápido |
| `Ctrl+S` | Guardar borrador |
| `Ctrl+L` | Limpiar formulario |
| `Esc` | Cerrar errores |

## Stack Tecnológico

- **Framework**: Next.js 15 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **IA**: OpenAI API (opcional)
- **Persistencia**: localStorage (cliente) + JSON/FS (servidor)
- **Testing**: Vitest

## Inicio Rápido

### Requisitos previos

- Node.js 18.x o superior
- npm 9.x o superior

### Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd generador-interconsultas

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Configuración

### Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# OpenAI API (opcional - para mejora con IA)
OPENAI_API_KEY=tu_clave_de_openai_aqui

# Webhooks externos (opcional - para integración con n8n/Zapier)
WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/xxx
WEBHOOK_SECRET=secreto_opcional_para_autenticacion
```

### Configuración de IA (opcional)

Para habilitar la mejora de redacción con IA:

1. Obtén una clave API en [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Añádela a `.env.local` como `OPENAI_API_KEY`
3. Reinicia el servidor de desarrollo

### Integración con n8n/Webhooks

El sistema puede enviar automáticamente los documentos generados a servicios externos como n8n, Zapier o Make.

#### Configuración del webhook

1. **En n8n**: Crea un nuevo workflow con trigger "Webhook"
2. Copia la URL del webhook (ej: `https://tu-n8n.com/webhook/abc123`)
3. Añádela a `.env.local` como `WEBHOOK_URL`
4. (Opcional) Configura `WEBHOOK_SECRET` para autenticación

#### Payload del webhook

```json
{
  "event": "document.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "type": "interconsulta",
    "text": "Texto del documento generado...",
    "formData": {
      "servicioDestino": "Cardiología",
      "paciente": { "nombre": "...", "edad": 65 },
      "informacionClinica": { ... }
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Guía de Uso

### 1. Modo estándar vs Modo rápido

**Modo estándar**: Todos los campos disponibles, dos columnas
**Modo rápido** (Ctrl+M): Solo campos esenciales, una columna, auto-generación

Para activar el Modo Rápido:
- Pulsa el toggle "Modo Rápido" en la cabecera
- O usa el atajo `Ctrl+M`

### 2. Generar una interconsulta

1. Accede a la página principal
2. Rellena el formulario con los datos:
   - **Datos generales**: Servicio destino, prioridad
   - **Datos del paciente**: Nombre/iniciales, edad, sexo
   - **Información clínica**: Motivo, antecedentes, exploración, presunción diagnóstica
   - **Datos del médico**: Nombre, servicio, centro
3. Pulsa "Generar Interconsulta" o usa **Ctrl+Enter**
4. El texto generado aparece en el panel derecho con formato A4

### 3. Usar frases rápidas

1. En cualquier campo de texto clínico, verás botones de frases rápidas
2. Haz clic en una frase para insertarla
3. Gestiona tus frases en Configuración > Frases Rápidas

### 4. Generar múltiples documentos del mismo caso

1. Genera el primer documento
2. Pulsa el menú "Multi-Documento" (icono de documentos apilados)
3. Selecciona el siguiente tipo de documento
4. Los datos del paciente se mantienen

### 5. Revisar con checklist

1. Genera un documento
2. Ve a la pestaña "Checklist" en el panel de resultado
3. Marca los items conforme los revisas
4. El progreso se muestra en el badge de la pestaña

### 6. Ver cambios de la IA

1. Genera un documento y aplica mejora con IA
2. Aparecerá la pestaña "Cambios IA"
3. Verás el diff visual: verde = añadido, rojo = eliminado

### 7. Ver analítica de uso

1. Accede a `/analitica` desde el enlace del footer
2. Verás:
   - Total de documentos generados
   - Tiempo estimado ahorrado
   - Desglose por servicio y tipo
   - Gráfica de últimos 7 días

### 8. Configuración

Accede a `/configuracion` para:

- **Branding**: Nombre y colores de tu centro
- **Frases Rápidas**: Crear y gestionar frases predefinidas
- **Servicios Destino**: Editar lista de especialidades
- **Plantillas**: Personalizar formato del documento
- **Webhooks**: Configurar integración con n8n/Zapier
- **IA**: Ver estado de la integración con OpenAI

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── enhance-interconsulta/   # API para mejora con IA
│   │   ├── hooks/                   # Webhooks (interconsulta-creada)
│   │   ├── plantillas/              # API para gestión de plantillas
│   │   └── servicios/               # API CRUD para servicios destino
│   ├── analitica/                   # Página de estadísticas
│   ├── configuracion/               # Página de configuración
│   ├── layout.tsx                   # Layout principal
│   ├── page.tsx                     # Página principal (generador)
│   └── globals.css                  # Estilos globales + @media print
├── components/
│   ├── InterconsultaForm.tsx        # Formulario con presets y atajos
│   ├── GeneratedTextPanel.tsx       # Panel con checklist/diff/IA
│   ├── DocumentPreview.tsx          # Vista profesional A4
│   ├── Header.tsx                   # Cabecera de navegación
│   └── LegalDisclaimer.tsx          # Aviso legal obligatorio
├── data/
│   ├── presets.ts                   # Presets por especialidad
│   ├── checklists.ts                # Checklists de revisión
│   └── default-config.ts            # Configuración por defecto
├── lib/
│   ├── server/
│   │   └── configRepo.ts            # Repositorio servidor (FS/JSON)
│   ├── ai.ts                        # Capa IA con manejo de errores
│   ├── analytics.ts                 # Sistema de analítica
│   ├── branding.ts                  # Configuración de branding
│   ├── caseManager.ts               # Gestión multi-documento
│   ├── frasesRapidas.ts             # Biblioteca de frases
│   ├── historial.ts                 # Historial de documentos
│   ├── quickMode.ts                 # Modo consulta rápida
│   ├── storage.ts                   # Utilidades cliente
│   ├── templateEngine.ts            # Motor de plantillas
│   ├── textDiff.ts                  # Comparación de textos
│   └── validation.ts                # Validaciones del formulario
└── types/
    └── index.ts                     # Tipos TypeScript del dominio
```

## Producción

### Checklist de despliegue

- [ ] **Variables de entorno**: Configurar `OPENAI_API_KEY` y `WEBHOOK_URL` en el hosting
- [ ] **Build**: Ejecutar `npm run build` sin errores
- [ ] **Tests**: Ejecutar `npm run test` - todos deben pasar
- [ ] **Lint**: Ejecutar `npm run lint` sin warnings críticos
- [ ] **HTTPS**: Asegurar que el sitio se sirve por HTTPS
- [ ] **Webhook**: Verificar que el webhook externo está activo
- [ ] **IA**: Confirmar que la API key de OpenAI tiene créditos

### Variables de entorno en producción

```env
# Requeridas
NODE_ENV=production

# Opcionales (funcionalidad reducida sin ellas)
OPENAI_API_KEY=sk-...
WEBHOOK_URL=https://...
WEBHOOK_SECRET=...
```

### Plataformas recomendadas

- **Vercel**: Despliegue automático desde GitHub
- **Railway**: Buen soporte para Next.js
- **Render**: Alternativa económica

## Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar en producción
npm start

# Linting
npm run lint

# Tests
npm run test

# Tests con coverage
npm run test:coverage
```

## Aviso Legal Importante

> **Este sistema genera borradores de documentos clínicos. El contenido debe ser revisado y validado por el médico responsable antes de su uso. La decisión clínica recae siempre en el profesional sanitario.**

### Principios éticos y legales

- La herramienta **NO toma decisiones clínicas**
- Solo reestructura la información que introduce el usuario
- El contenido generado es un **borrador**, no un documento final
- La mejora con IA solo modifica redacción, **NO añade diagnósticos ni datos clínicos**
- El médico es siempre el responsable final del documento

### Privacidad

- Los datos clínicos **NO se envían a servidores** (excepto mejora con IA si está activada)
- La analítica de uso se guarda localmente en el navegador
- Los webhooks solo envían datos si el usuario los configura explícitamente

## Limitaciones

- **Sin autenticación**: No hay sistema de login (preparado para multi-tenant)
- **Persistencia básica**: Datos en JSON/FS (preparado para Prisma/PostgreSQL)
- **Sin integración HIS**: No se conecta con sistemas hospitalarios
- **Sin almacenamiento de pacientes**: Los datos clínicos no se guardan en servidor

## Evolución Futura

### Próximas funcionalidades planificadas

1. **Autenticación y multiusuario**
   - Login con NextAuth/Clerk
   - Roles (médico, administrador)
   - Perfiles de médico guardados

2. **Persistencia real**
   - Base de datos PostgreSQL con Prisma
   - Historial de interconsultas generadas (anonimizado)

3. **Plantillas por hospital/servicio**
   - Diferentes formatos según centro
   - Plantillas compartidas entre usuarios

4. **Integración con HIS**
   - Conexión con sistemas hospitalarios
   - Importación de datos del paciente

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Abre un issue describiendo el cambio propuesto
2. Haz fork del repositorio
3. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
4. Haz commit de tus cambios
5. Abre un Pull Request

## Licencia

Proyecto privado. Todos los derechos reservados.

---

**Desarrollado para profesionales sanitarios** | v3.0
