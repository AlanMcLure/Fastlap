# Consulta para el abogado: preguntas y contexto

Documento corto para llevar a una primera consulta de revisión. Acompáñalo de los demás archivos de esta carpeta, sobre todo [INVENTARIO-DATOS.md](INVENTARIO-DATOS.md). Los textos son **borradores técnicos**, no asesoramiento; esta lista recoge lo que no puedo decidir yo.

## 1. El proyecto en cinco líneas

- **FastLap**: red social en español para aficionados a la Fórmula 1 (comunidades, publicaciones, comentarios, votos) con un panel de datos de F1 y pronósticos entre usuarios.
- Acceso **solo con Google**; el usuario elige un nombre público y puede cambiarlo. No hay publicidad, analítica ni pagos (Premium existe en el código pero está desactivado).
- Gratuita, sin premios ni dinero en los pronósticos.
- Titular: persona física [PENDIENTE: confirmar si autónomo, particular o futura sociedad]. **No está desplegada ni abierta al público.**
- Proveedores previstos: base de datos Postgres (Neon u otro), Redis (Upstash), subida de imágenes (UploadThing), alojamiento [PENDIENTE], Google (inicio de sesión). Datos de F1 de Jolpica-F1 (licencia CC BY-NC-SA 4.0).

## 2. Qué ya está hecho en el código (para que no se pague por revisarlo dos veces)

| Tema | Estado |
|---|---|
| Inventario de datos personales | Hecho, verificado contra el código (17 categorías, terceros, derechos) |
| Borrado de cuenta | Hecho: botón en Ajustes; lo publicado queda como «Usuario eliminado», lo personal se borra |
| Exportación de datos (portabilidad) | Hecho: JSON descargable desde Ajustes, sin credenciales |
| Edad mínima | Declaración con casilla (14 años) y constancia de fecha y versión; **no verificable** |
| Contenido incrustado de terceros | Retirado (solo imágenes y enlaces) |
| Tokens de Google | Ya no se guardan |
| Denuncias | Cualquier usuario denuncia; un administrador revisa, elimina o descarta, avisa al autor y deja registro |
| Cookies | Solo técnicas (sesión, protección CSRF, aviso breve de consentimiento y preferencia de tema en el navegador) |

Detalle y cómo estaba antes: [CAMBIOS-TECNICOS.md](CAMBIOS-TECNICOS.md).

## 3. Preguntas

### A. Quién es el titular y qué normas le alcanzan
1. Siendo gratuita y sin publicidad, ¿le aplica la LSSI-CE (aviso legal con datos del titular)? ¿Qué datos hay que publicar si es persona física: domicilio, NIF, correo?
2. ¿Conviene constituir una sociedad (o inscribirse como autónomo) antes de abrir al público, o puede operar como particular? ¿Cambia algo si luego se activa Premium o se añade publicidad?
3. ¿Es necesario un correo de contacto específico y publicar el domicilio? ¿Hay formas de no exponer el domicilio personal?

### B. Protección de datos (RGPD / LOPDGDD)
4. ¿Las bases jurídicas propuestas (contrato, interés legítimo en moderación y seguridad) son correctas para cada tratamiento del inventario?
5. ¿Es obligatorio llevar un registro de actividades de tratamiento y nombrar un delegado de protección de datos? ¿Hace falta una evaluación de impacto?
6. **Encargados del tratamiento**: ¿qué contratos o cláusulas (art. 28) hay que tener con la base de datos, Redis, UploadThing y el alojamiento? ¿Basta aceptar sus condiciones estándar?
7. **Transferencias fuera del EEE** (Google, UploadThing, Upstash, EE. UU.): ¿qué mecanismo documentar y qué decir en la política?
8. **Plazos de conservación**: ¿qué plazo razonable para el registro de decisiones de moderación, las denuncias y las copias de seguridad?
9. **Anonimización al borrar la cuenta**: las publicaciones y comentarios se conservan sin el nombre. ¿Es suficiente como supresión, dado que el texto puede contener datos personales que escribió la propia persona? ¿Hay que ofrecer también borrar ese texto bajo petición?
10. Las imágenes subidas a UploadThing no se borran automáticamente al borrar la cuenta. ¿Es un incumplimiento si se documenta y se atiende por petición mientras no se automatice?
11. **Brechas de seguridad**: ¿qué protocolo mínimo documentar (plazo de 72 h, a quién notificar)?
12. ¿Hace falta algún aviso adicional por usar el correo de Google solo para identificar la cuenta (no hay correos de marketing ni de notificación)?

### C. Menores
13. ¿Basta una **declaración con casilla** para exigir 14 años, o hay que establecer algún tipo de verificación? ¿Qué hacer si se detecta una cuenta de un menor de 14 (la política dice que se eliminará)?
14. Entre los 14 y los 18 años, ¿hay alguna obligación específica (lenguaje claro, avisos reforzados)?

### D. Cookies y almacenamiento
15. Con solo cookies técnicas y preferencias en el navegador, ¿se puede prescindir de banner? ¿La cookie breve del consentimiento de edad se considera técnica?

### E. Contenido de los usuarios y Reglamento de Servicios Digitales (DSA)
16. ¿Se considera la web «servicio de alojamiento de datos»? Si sí, ¿qué obligaciones aplican a un servicio muy pequeño?
17. **Notificación y acción** (art. 16): ¿basta el botón de denunciar o hay que ofrecer un formulario con campos concretos (motivo, ubicación exacta, identidad del denunciante)?
18. **Motivación de las decisiones** (art. 17): hoy se avisa al autor cuando se elimina su contenido, pero sin explicación detallada. ¿Qué mínimo hay que comunicar?
19. **Recurso**: ¿hay que ofrecer un procedimiento de reclamación interno? ¿Cómo se redacta sin comprometerse a plazos imposibles?
20. ¿Hay que designar un punto de contacto público para autoridades y usuarios? ¿Los **informes de transparencia** o el resto de obligaciones de las plataformas en línea quedan excluidos por ser microempresa?
21. Responsabilidad del titular por el contenido ilícito de los usuarios: ¿qué cláusulas ayudan realmente y cuáles son decorativas? ¿Qué protocolo seguir ante un requerimiento de una autoridad o una denuncia por derechos de autor, difamación o derecho al honor?

### F. Propiedad intelectual y marcas
22. El nombre, las siglas y el logotipo de «Formula 1», «F1», los equipos y los nombres de los pilotos son marcas o datos protegidos. ¿Qué uso es lícito en una web de aficionados (nombres de pilotos y equipos en estadísticas y textos)? ¿Qué aviso de «no afiliación» hay que poner?
23. **Datos de Jolpica-F1** (CC BY-NC-SA 4.0, uso no comercial): ¿qué implica para una web gratuita hoy y qué cambiaría si hubiera publicidad o Premium? La licencia **comparte igual** (SA): ¿afecta a la API pública que expone datos de temporadas cerradas?
24. Los usuarios suben imágenes y texto: ¿qué licencia hay que pedirles en las condiciones y cómo se redacta la cesión mínima para poder mostrarlo?
25. Imágenes de pilotos o fotos de carreras subidas por usuarios: ¿hay riesgo de derechos de imagen o de autor y cómo se gestiona?

### G. Pronósticos y futuro
26. Los pronósticos y el «Piloto del Día» son un juego gratuito sin premios. ¿A partir de qué punto (premios, patrocinios, apuestas entre usuarios) entra la normativa de juego?
27. Si algún día se activa **Premium**: ¿qué hay que añadir (condiciones de contratación, desistimiento, facturación, IVA, tratamiento por Stripe)?
28. ¿Qué cambios futuros deberían avisarme de que hay que volver a consultar (analítica, publicidad, correos, aplicación móvil, otro país)?

### H. Los textos
29. ¿Qué partes de los borradores son innecesarias, demasiado largas o mal planteadas para una web de este tamaño?
30. ¿Falta algún documento (por ejemplo una política de moderación o un procedimiento de reclamación)?

## 4. Datos que llevar rellenos

Los `[PENDIENTE]` que solo puede completar el titular: nombre, NIF, domicilio, correo de contacto, proveedores y regiones elegidas, plazos de conservación y jurisdicción. Para ver los que quedan:

```
grep -rn "PENDIENTE" docs/legal
```

## 5. Qué llevar

1. Este documento.
2. [INVENTARIO-DATOS.md](INVENTARIO-DATOS.md) y los cinco borradores.
3. [CAMBIOS-TECNICOS.md](CAMBIOS-TECNICOS.md), por si pregunta cómo funciona el borrado, la exportación o la declaración de edad.
4. Acceso a una demostración (cuando exista) o capturas de las pantallas de acceso, Ajustes y denuncia.
