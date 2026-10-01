# Consulta para el abogado: preguntas y contexto de [PROYECTO]

Acompáñalo del inventario y los borradores. Son borradores técnicos, no asesoramiento.

## 1. El proyecto en cinco líneas
[Qué es, quién lo usa, acceso, si hay pagos/publicidad/analítica, titular y forma jurídica, estado (¿desplegado? ¿abierto al público?), proveedores y datos de terceros con licencia.]

## 2. Qué ya está hecho en el código
| Tema | Estado |
|---|---|
| Inventario de datos | |
| Borrado de cuenta | |
| Exportación de datos | |
| Edad mínima | |
| Contenido incrustado | |
| Tokens / datos innecesarios | |
| Moderación | |
| Cookies | |

## 3. Preguntas (quita las áreas que no apliquen)

### A. Titular y normas aplicables
- ¿Le aplica la LSSI-CE? ¿Qué datos hay que publicar si es persona física? ¿Conviene sociedad o autónomo antes de abrir? ¿Cambia con publicidad o pagos?

### B. Protección de datos (RGPD / LOPDGDD)
- ¿Son correctas las bases jurídicas del inventario? ¿Registro de actividades, DPD o evaluación de impacto obligatorios?
- Contratos con encargados (art. 28) y transferencias fuera del EEE: ¿qué documentar?
- Plazos de conservación razonables (moderación, copias de seguridad).
- Si lo publicado se anonimiza al borrar la cuenta: ¿basta como supresión?
- Archivos en terceros que no se borran automáticamente: ¿se documenta y se atiende bajo petición?
- Brechas: ¿qué protocolo mínimo (72 h)?

### C. Menores
- ¿Basta una declaración con casilla? ¿Obligaciones entre 14 y 18? ¿Qué hacer con una cuenta de un menor?

### D. Cookies
- Con solo técnicas, ¿se puede prescindir de banner?

### E. Contenido de usuarios y DSA
- ¿Es servicio de alojamiento? ¿Notificación y acción (art. 16), motivación (art. 17), recurso interno, punto de contacto, excepciones de microempresa? ¿Qué protocolo ante requerimientos y denuncias por derechos de autor, honor o difamación?

### F. Propiedad intelectual y marcas
- Uso lícito de nombres, siglas y logos de terceros; aviso de no afiliación; licencias de datos (no comercial, compartir igual); licencia mínima a pedir a los usuarios; derechos de imagen.

### G. Futuro
- Juegos o premios, pagos, publicidad, correos, app móvil, otros países: ¿qué obliga a volver a consultar?

### H. Los textos
- ¿Qué sobra, qué falta, qué está mal planteado para un servicio de este tamaño?

## 4. Datos que llevar rellenos
Los `[PENDIENTE]` (`grep -rn PENDIENTE docs/legal`).

## 5. Qué llevar
Este documento, el inventario, los borradores, el registro de cambios técnicos y una demo o capturas.
