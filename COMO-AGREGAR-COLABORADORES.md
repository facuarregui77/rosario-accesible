# 👥 Cómo agregar colaboradores a Rosario Access Map

La app funciona con el modelo **"equipo de confianza"**: el registro público está **cerrado**,
así que nadie puede crearse una cuenta solo. Los colaboradores los **creás vos a mano** desde Supabase.

Una vez creados, **cualquier colaborador logueado puede editar y relevar** datos (igual que vos).
El público general solo puede dejar opiniones y *sugerencias* (que vos moderás).

> ⚠️ Sumá solo a **gente de confianza**: todos los colaboradores tienen el mismo poder de edición.

---

## ➕ Agregar un colaborador (paso a paso)

1. Entrá a **https://supabase.com** y logueate.
2. Abrí tu proyecto (**mapa-accesible**).
3. En el menú de la izquierda, entrá a **Authentication** (ícono de personas / candado).
4. Tocá la pestaña **Users**.
5. Arriba a la derecha, tocá **"Add user"** → **"Create new user"**.
6. Completá:
   - **Email**: el correo del colaborador.
   - **Password**: una contraseña (puede ser temporal; que después la cambie).
   - ✅ Activá **"Auto Confirm User"** (importante: si no, la cuenta queda sin confirmar y no puede entrar).
7. Tocá **"Create user"**.
8. ¡Listo! Ya aparece en la lista de usuarios.

---

## 📨 Pasarle los datos al colaborador

Decile (por un medio seguro, no público):
- El **email** y la **contraseña** que creaste.
- El link de la app: **https://access-app-rosario.vercel.app**

### Cómo inicia sesión el colaborador
1. Abre la app.
2. Toca el **candado** 🔒 (al lado del título).
3. Ingresa su **email y contraseña**.
4. El candado pasa a verde 🔓 → ya puede **editar lugares, relevar y aprobar sugerencias**.

> Para cargar datos, que siga la guía **[COMO-RELEVAR.md](COMO-RELEVAR.md)**.

---

## 🔑 Que el colaborador cambie su contraseña (recomendado)

Como vos creaste una contraseña inicial, lo ideal es que el colaborador la cambie por una propia.
Hoy la app no tiene un botón de "cambiar contraseña" integrado, así que tenés dos opciones:

- **Opción simple**: dejás la contraseña que creaste (sirve perfecto para un equipo chico de confianza).
- **Opción con cambio**: desde Supabase → **Authentication → Users**, tocás los **tres puntitos (⋯)**
  al lado del usuario → **"Send password recovery"** (le llega un mail para que ponga su propia clave).

---

## ➖ Quitar un colaborador

1. Supabase → **Authentication → Users**.
2. Buscá el usuario en la lista.
3. Tocá los **tres puntitos (⋯)** a la derecha → **"Delete user"**.
4. Confirmá.

> Borrar un usuario **no borra ningún dato del mapa**: los lugares, accesos y reseñas no están atados
> a la cuenta. Solo se le quita el acceso para editar.

---

## 🛡️ Notas de seguridad

- **No abras el registro público.** Tiene que quedar en *Authentication → Sign In / Providers →*
  **"Allow new users to sign up" = OFF**. Así solo existen las cuentas que vos creás.
- Nunca compartas contraseñas por canales públicos (grupos abiertos, redes, etc.).
- Si un colaborador deja el equipo, **borrá su usuario** (paso de arriba) para cortarle el acceso.
- Todos los colaboradores tienen el mismo nivel de permisos (pueden editar todo). No hay roles
  diferenciados por ahora; si en el futuro querés "editores limitados", se puede armar con más reglas.
