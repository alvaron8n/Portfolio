# Generador de Interconsultas

**SaaS profesional para la generación de borradores de interconsultas médicas**

Una herramienta diseñada para médicos de atención primaria y hospitalaria que necesitan generar documentos de interconsulta/derivación de forma rápida y estructurada.

## Descripción

Los médicos dedican una cantidad significativa de tiempo a rellenar interconsultas y derivaciones, repitiendo estructuras similares múltiples veces al día. Este generador automatiza la creación del documento estructurado, permitiendo al profesional centrarse en el contenido clínico relevante.

### Características principales

- **Formulario estructurado**: Campos organizados por secciones (datos del paciente, información clínica, datos del médico)
- **Generación instantánea**: Texto formateado listo para copiar y pegar
- **Vista profesional A4**: Previsualización del documento con formato de página real
- **Presets por especialidad**: Plantillas predefinidas para Cardiología, Neurología, Digestivo, etc.
- **Plantillas configurables**: Sistema de plantillas con placeholders personalizables
- **Servicios destino editables**: Lista de especialidades médicas configurable
- **Mejora con IA** (opcional): Mejora de redacción usando OpenAI (no modifica contenido clínico)
- **Modos de IA**: Mejorar redacción, formatear o resumir texto
- **Impresión optimizada**: Botón de imprimir con estilos @media print
- **Atajos de teclado**: Ctrl+Enter para generar, Esc para cerrar errores
- **Auto-focus**: El cursor se posiciona automáticamente en el primer campo
- **Integración webhooks**: Envía documentos a n8n, Zapier, Make u otros servicios
- **Persistencia servidor**: Datos almacenados en servidor (JSON/FS)
- **Dark mode**: Soporte completo para modo oscuro
- **Diseño responsive**: Funciona en escritorio y móvil

## Stack Tecnológico

- **Framework**: Next.js 15 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **IA**: OpenAI API (opcional)
- **Persistencia**: JSON/FileSystem en servidor, preparado para migrar a Prisma/PostgreSQL
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

Cuando se genera un documento, se envía un POST con este formato:

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

#### Ejemplo de workflow n8n

1. **Trigger**: Webhook (POST)
2. **Procesar datos**: Function node para extraer información
3. **Acciones**:
   - Guardar en Google Sheets/Notion
   - Enviar email de confirmación
   - Crear tarea en sistema de gestión
   - Generar PDF y almacenar

## Uso

### 1. Generar una interconsulta

1. Accede a la página principal
2. Rellena el formulario con los datos:
   - **Datos generales**: Servicio destino, prioridad
   - **Datos del paciente**: Nombre/iniciales, edad, sexo
   - **Información clínica**: Motivo, antecedentes, exploración, presunción diagnóstica
   - **Datos del médico**: Nombre, servicio, centro
3. Pulsa "Generar Interconsulta" o usa **Ctrl+Enter**
4. El texto generado aparece en el panel derecho con formato A4
5. Opciones disponibles:
   - **Copiar**: Copiar al portapapeles
   - **Imprimir**: Imprimir documento con formato optimizado
   - **Vista previa**: Ver documento en formato profesional

### 2. Usar presets de especialidad

1. Selecciona un servicio destino (ej: Cardiología)
2. Si hay preset disponible, aparecerá un botón "Usar plantilla de..."
3. Al pulsar, se cargan textos sugeridos como recordatorio de qué incluir
4. Adapta el contenido al caso clínico específico

### 3. Mejorar con IA (si está configurada)

1. Genera primero una interconsulta
2. Selecciona un modo de mejora:
   - **Mejorar redacción**: Claridad y estilo sin cambiar contenido
   - **Formatear**: Estructura y organización visual
   - **Resumir**: Versión más concisa
3. La IA mejorará la redacción **sin modificar información clínica**

### 4. Configuración

Accede a `/configuracion` para:

- Editar la lista de servicios destino
- Personalizar la plantilla de interconsulta
- Configurar webhooks
- Restaurar valores por defecto

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── enhance-interconsulta/   # API para mejora con IA
│   │   ├── hooks/                   # Webhooks (interconsulta-creada)
│   │   ├── plantillas/              # API para gestión de plantillas
│   │   └── servicios/               # API CRUD para servicios destino
│   ├── configuracion/               # Página de configuración
│   ├── layout.tsx                   # Layout principal
│   ├── page.tsx                     # Página principal (generador)
│   └── globals.css                  # Estilos globales + @media print
├── components/
│   ├── InterconsultaForm.tsx        # Formulario con presets y atajos
│   ├── GeneratedTextPanel.tsx       # Panel con copiar/imprimir/IA
│   ├── DocumentPreview.tsx          # Vista profesional A4
│   ├── Header.tsx                   # Cabecera de navegación
│   └── LegalDisclaimer.tsx          # Aviso legal obligatorio
├── data/
│   ├── presets.ts                   # Presets por especialidad
│   └── default-config.ts            # Configuración por defecto
├── lib/
│   ├── server/
│   │   └── configRepo.ts            # Repositorio servidor (FS/JSON)
│   ├── ai.ts                        # Capa IA con manejo de errores
│   ├── storage.ts                   # Utilidades cliente
│   ├── templateEngine.ts            # Motor de plantillas
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

> **Este sistema genera borradores de interconsulta. El contenido debe ser revisado y validado por el médico responsable antes de su uso. La decisión clínica recae siempre en el profesional sanitario.**

### Principios éticos y legales

- La herramienta **NO toma decisiones clínicas**
- Solo reestructura la información que introduce el usuario
- El contenido generado es un **borrador**, no un documento final
- La mejora con IA solo modifica redacción, **NO añade diagnósticos ni datos clínicos**
- El médico es siempre el responsable final del documento

## Limitaciones

- **Sin autenticación**: No hay sistema de login (preparado para multi-tenant)
- **Persistencia básica**: Datos en JSON/FS (preparado para Prisma/PostgreSQL)
- **Sin integración HIS**: No se conecta con sistemas hospitalarios
- **Sin almacenamiento de pacientes**: Los datos clínicos no se guardan

## Evolución Futura

### Próximas funcionalidades planificadas

1. **Autenticación y multiusuario**
   - Login con NextAuth/Clerk
   - Roles (médico, administrador)
   - Perfiles de médico guardados

2. **Persistencia real**
   - Base de datos PostgreSQL con Prisma
   - Historial de interconsultas generadas (anonimizado)

3. **Más tipos de documentos**
   - Informes de alta
   - Peticiones de pruebas diagnósticas
   - Informes para trabajo social
   - Certificados médicos

4. **Plantillas por hospital/servicio**
   - Diferentes formatos según centro
   - Plantillas compartidas entre usuarios

5. **Integración con HIS**
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

**Desarrollado para profesionales sanitarios** | v2.0
