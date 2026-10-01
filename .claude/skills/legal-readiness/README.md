# legal-readiness

Skill de Claude Code para preparar un proyecto web antes de publicarlo (RGPD, LOPDGDD, LSSI-CE, DSA): inventario de datos, lista de huecos técnicos, borradores legales y consulta con el abogado. **No es asesoramiento legal.**

## Instalar en otro proyecto
Copia esta carpeta entera:

```
.claude/skills/legal-readiness/   →   <otro-proyecto>/.claude/skills/legal-readiness/
```

Para tenerla en todos tus proyectos en tu propio ordenador, cópiala a `~/.claude/skills/legal-readiness/`. (En sesiones en la nube el home no se conserva: allí conviene que viva dentro del repositorio.)

Luego, en el proyecto, pide: «prepara este proyecto para publicarlo» o invoca `/legal-readiness`.

## Contenido
- `SKILL.md`: reglas y flujo.
- `scripts/scan.sh`: escáner de señales (dependencias, modelos de datos, cookies y almacenamiento, hosts externos, variables de entorno, documentos legales existentes). Solo lee; no cambia nada.
- `templates/`: inventario, lista técnica, esqueletos de los documentos y consulta con el abogado.

Ejemplo completo y real: `docs/legal/` de FastLap.
