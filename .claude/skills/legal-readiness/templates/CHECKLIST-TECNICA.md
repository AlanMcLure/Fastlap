# Lista técnica: huecos que suelen aparecer

Marca cada punto ✅ / ⚠️ / ❌ con el archivo que lo demuestra. Recomienda, no arregles sin confirmación.

## Datos y cuentas
- [ ] **Borrado de cuenta**: ¿existe botón y endpoint? Comprueba las claves foráneas: relaciones sin cascada (`Restrict`) bloquean el borrado y relaciones en cascada pueden **destruir contenido de otras personas** (comentarios con respuestas). Patrón recomendado: reasignar lo publicado a un usuario compartido «eliminado», borrar lo personal en una transacción, invalidar cachés, proteger a los administradores y confirmar con el nombre de usuario.
- [ ] **Exportación de datos**: JSON descargable con todo lo que se guarda del usuario, sin credenciales; limitada en frecuencia. Mantenerla sincronizada con el borrado cuando se añadan modelos.
- [ ] **Datos que se guardan sin usarse**: tokens de proveedores OAuth (access, refresh, id), correos, IP, datos de dispositivo. Principio de minimización: si no se usa, no se guarda.
- [ ] **Imágenes y archivos**: ¿se borran del proveedor al borrar la cuenta o el contenido?
- [ ] **Cuentas de sistema** (bots, «eliminado»): ¿correo `.invalid`? ¿nombres de usuario reservados?
- [ ] **Sesiones**: ¿qué pasa en otros dispositivos al borrar la cuenta? ¿caducidad razonable?

## Menores y consentimiento
- [ ] **Edad mínima** (14 en España): casilla de declaración antes de crear la cuenta + constancia (fecha y versión de las condiciones). Es una declaración, no una verificación; si el proveedor de identidad no da la fecha de nacimiento, no se puede comprobar. Verifica en un navegador real que una cuenta nueva no se crea sin la casilla y que las existentes entran.
- [ ] **Consentimiento** donde haga falta: cookies no técnicas, analítica, marketing, correos.

## Terceros y cookies
- [ ] **Cookies y almacenamiento**: lista exacta (cookies, `localStorage`, caché de service worker) y su finalidad; ¿solo técnicas?
- [ ] **Contenido incrustado** (iframes de vídeo o redes): cookies de terceros y fuga de IP. Opciones: quitar la herramienta (lo simple), bloquear hasta consentimiento, o modo sin cookies. No olvides cómo se pintan los **posts antiguos**.
- [ ] **Recursos externos**: fuentes, scripts, imágenes de CDN, mapas, vídeos: cada uno envía la IP del visitante.
- [ ] **Analítica / publicidad / píxeles**: ¿hay alguna? Si no, dilo (y compruébalo con el escáner).
- [ ] **Encargados**: ¿hay contrato (art. 28) con cada proveedor que trata datos? ¿regiones y transferencias fuera del EEE?

## Contenido de usuarios y moderación
- [ ] **Denuncias** y cola de revisión; ¿deja registro?; ¿se avisa al autor?; ¿con motivo?; ¿hay forma de reclamar?
- [ ] **Notificación de contenido ilícito** (DSA art. 16) y **motivación de decisiones** (art. 17), punto de contacto: pregunta al abogado qué alcanza a un servicio pequeño.
- [ ] **Retirada de contenido propio** por el autor.
- [ ] **Notificaciones o textos** que repiten el nombre de quien se va (se anonimizan al borrar).

## Producto
- [ ] **Función de pago, premios o juegos**: cambia el marco (consumidores, desistimiento, juego).
- [ ] **FAQs y textos de la web** coherentes con el código y con los borradores (si hay un test que bloquee afirmaciones falsas, úsalo).
- [ ] **Datos de terceros con licencia** (APIs, estadísticas, mapas): ¿uso no comercial? atribución obligatoria; «compartir igual».
- [ ] **Marcas y nombres de terceros**: aviso de no afiliación; evitar logos y material con derechos.

## Mantenimiento
- [ ] Una **regla en la guía del proyecto**: cualquier cambio que altere qué datos se recogen, guardan, comparten o muestran actualiza el inventario y los borradores en el mismo cambio.
- [ ] Un **test de integración** del borrado y la exportación contra una base real (se salta sin variable de entorno).
