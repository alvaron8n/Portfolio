# Generador de Interconsultas

**SaaS profesional para la generación de borradores de interconsultas médicas**

Una herramienta diseñada para médicos de atención primaria y hospitalaria que necesitan generar documentos de interconsulta/derivación de forma rápida y estructurada.

## Descripción

Los médicos dedican una cantidad significativa de tiempo a rellenar interconsultas y derivaciones, repitiendo estructuras similares múltiples veces al día. Este generador automatiza la creación del documento estructurado, permitiendo al profesional centrarse en el contenido clínico relevante.

### Características principales

- **Formulario estructurado**: Campos organizados por secciones (datos del paciente, información clínica, datos del médico)
- **Generación instantánea**: Texto formateado listo para copiar y pegar
- **Plantillas configurables**: Sistema de plantillas con placeholders personalizables
- **Servicios destino editables**: Lista de especialidades médicas configurable
- **Mejora con IA** (opcional): Mejora de redacción usando OpenAI (no modifica contenido clínico)
- **Diseño responsive**: Funciona en escritorio y móvil

## Stack Tecnológico

- **Framework**: Next.js 15 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **IA**: OpenAI API (opcional)
- **Persistencia**: localStorage (MVP), preparado para migrar a base de datos

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

### Configuración de IA (opcional)

Para habilitar la mejora de redacción con IA:

1. Crea un archivo `.env.local` en la raíz del proyecto:

```env
OPENAI_API_KEY=tu_clave_de_openai_aqui
```

2. Reinicia el servidor de desarrollo

La clave de API se puede obtener en [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

## Uso

### 1. Generar una interconsulta

1. Accede a la página principal
2. Rellena el formulario con los datos:
   - **Datos generales**: Servicio destino, prioridad
   - **Datos del paciente**: Nombre/iniciales, edad, sexo
   - **Información clínica**: Motivo, antecedentes, exploración, presunción diagnóstica
   - **Datos del médico**: Nombre, servicio, centro
3. Pulsa "Generar Interconsulta"
4. El texto generado aparece en el panel derecho
5. Usa "Copiar" para copiar al portapapeles

### 2. Mejorar con IA (si está configurada)

1. Genera primero una interconsulta
2. Pulsa "Mejorar con IA"
3. La IA mejorará la redacción **sin modificar información clínica**

### 3. Configuración

Accede a `/configuracion` para:

- Editar la lista de servicios destino
- Personalizar la plantilla de interconsulta
- Restaurar valores por defecto

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── enhance-interconsulta/   # API para mejora con IA
│   │   └── servicios/               # API para gestión de servicios
│   ├── configuracion/               # Página de configuración
│   ├── layout.tsx                   # Layout principal
│   ├── page.tsx                     # Página principal (generador)
│   └── globals.css                  # Estilos globales
├── components/
│   ├── InterconsultaForm.tsx        # Formulario de interconsulta
│   ├── GeneratedTextPanel.tsx       # Panel de texto generado
│   ├── Header.tsx                   # Cabecera de navegación
│   └── LegalDisclaimer.tsx          # Aviso legal obligatorio
├── lib/
│   ├── ai.ts                        # Capa de servicio para IA
│   ├── storage.ts                   # Sistema de persistencia
│   ├── templateEngine.ts            # Motor de plantillas
│   └── validation.ts                # Validaciones del formulario
├── types/
│   └── index.ts                     # Tipos TypeScript del dominio
└── data/
    └── default-config.ts            # Configuración por defecto
```

## Aviso Legal Importante

> **Este sistema genera borradores de interconsulta. El contenido debe ser revisado y validado por el médico responsable antes de su uso. La decisión clínica recae siempre en el profesional sanitario.**

### Principios éticos y legales

- La herramienta **NO toma decisiones clínicas**
- Solo reestructura la información que introduce el usuario
- El contenido generado es un **borrador**, no un documento final
- La mejora con IA solo modifica redacción, **NO añade diagnósticos ni datos clínicos**
- El médico es siempre el responsable final del documento

## Limitaciones del MVP

- **Sin autenticación**: No hay sistema de login (preparado para añadir)
- **Sin base de datos**: Datos almacenados en localStorage del navegador
- **Sin integración HIS**: No se conecta con sistemas hospitalarios
- **Sin almacenamiento de pacientes**: Los datos no se guardan entre sesiones

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
```

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

**Desarrollado para profesionales sanitarios** | MVP v1.0
