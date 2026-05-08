# 🏗️ Arquitectura de Microservicios en NestJS y TypeORM

## Índice
1. [¿Qué es TypeORM?](#qué-es-typeorm)
2. [La Arquitectura en Capas](#la-arquitectura-en-capas)
3. [TypeORM: Entidades](#typeorm-entidades)
4. [TypeORM: Relaciones](#typeorm-relaciones)
5. [TypeORM: Repositorios](#typeorm-repositorios)
6. [TypeORM: Migraciones](#typeorm-migraciones)

---

## ¿Qué es TypeORM?

### 🔤 Definición Simple

**TypeORM** es un **Object-Relational Mapping (ORM)** para TypeScript y JavaScript que facilita trabajar con bases de datos de forma segura y tipada.

En otras palabras: es un **traductor entre tu código JavaScript y la base de datos SQL**.

### 📚 Analogía: El Traductor

Imagina que:

```
┌─────────────────────────────────────────────────────────┐
│  Tu código JavaScript (lo que tú escribes)              │
│                                                          │
│  const usuario = new User();                            │
│  usuario.nombre = "Juan";                              │
│  await repository.save(usuario);                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ TypeORM TRADUCE
                 ▼
┌─────────────────────────────────────────────────────────┐
│  SQL (lo que entiende la BD)                            │
│                                                          │
│  INSERT INTO user (nombre) VALUES ('Juan')              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Base de Datos (PostgreSQL, MySQL, SQLite)              │
└─────────────────────────────────────────────────────────┘
```

**Sin TypeORM:**
```typescript
// Escribes SQL a mano ❌
const result = await connection.query(
  "INSERT INTO user (nombre, email) VALUES ($1, $2)",
  ["Juan", "juan@mail.com"]
);
```

**Con TypeORM:**
```typescript
// Escribes código limpio ✅
const usuario = new User();
usuario.nombre = "Juan";
usuario.email = "juan@mail.com";
await userRepository.save(usuario);
```

### 🎯 Principales características de TypeORM

| Característica | Qué significa |
|---|---|
| **ORM** | Mapea tablas de BD a clases JavaScript |
| **Type-Safe** | Te protege de errores de tipos |
| **Multi-BD** | Funciona con PostgreSQL, MySQL, SQLite, MongoDB, etc. |
| **Relaciones** | Maneja fácilmente relaciones entre tablas |
| **Migraciones** | Controla cambios de estructura de forma versionada |
| **QueryBuilder** | Construye queries complejas con código fluido |
| **Decoradores** | Usa `@Entity`, `@Column` para definir estructura |

### 💡 Diferencia: Sin vs Con TypeORM

**SIN TypeORM (difícil):**
```typescript
// Tienes que escribir SQL a mano
async getUser(id: number) {
  const query = `
    SELECT u.id, u.nombre, u.email, 
           p.id as post_id, p.titulo
    FROM users u
    LEFT JOIN posts p ON u.id = p.usuario_id
    WHERE u.id = $1
  `;
  const result = await db.query(query, [id]);
  
  // Tienes que mapear manualmente
  const usuario = {
    id: result[0].id,
    nombre: result[0].nombre,
    email: result[0].email,
    posts: result.map(r => ({
      id: r.post_id,
      titulo: r.titulo
    }))
  };
  return usuario;
}
```

**CON TypeORM (fácil):**
```typescript
// TypeORM se encarga de todo
async getUser(id: number) {
  return await this.userRepository.findOne({
    where: { id },
    relations: ['posts']  // Carga posts automáticamente
  });
}
```

### 🛡️ Beneficios de usar TypeORM

| Beneficio | Por qué importa |
|-----------|-----------------|
| **Seguridad** | SQL Injection: TypeORM parametriza queries automáticamente |
| **Productividad** | Escribes menos código, haces más |
| **Mantenibilidad** | Cambios de estructura sin reescribir queries |
| **Type Safety** | TypeScript te avisa de errores en tiempo de desarrollo |
| **Portabilidad** | Cambias de PostgreSQL a MySQL sin tocar código |
| **Testing** | Fácil mockear la BD en tests unitarios |

### ⚠️ Casos donde TypeORM es perfecto

✅ **Usa TypeORM cuando:**
- Tienes relaciones complejas entre tablas
- Necesitas cambiar la estructura de la BD frecuentemente
- Trabajas en equipo (type safety es crucial)
- Quieres código mantenible a largo plazo
- Necesitas usar validaciones en entidades

❌ **No necesitas TypeORM si:**
- Tienes queries ultra-simples
- Tu BD casi nunca cambia
- Es un proyecto muy pequeño (script rápido)

### 🚀 Cómo funciona TypeORM en 3 pasos

```
PASO 1: Defini tus ENTIDADES (tablas como clases)
┌────────────────────────────┐
│ @Entity('users')           │
│ export class User {        │
│   @PrimaryGeneratedColumn()│
│   id: number;              │
│   @Column()                │
│   nombre: string;          │
│ }                          │
└────────────────────────────┘
           ↓
PASO 2: TypeORM mapea esas clases a SQL
┌────────────────────────────┐
│ CREATE TABLE users (       │
│   id SERIAL PRIMARY KEY,   │
│   nombre VARCHAR NOT NULL  │
│ )                          │
└────────────────────────────┘
           ↓
PASO 3: Usas métodos simples para guardar/obtener datos
┌────────────────────────────┐
│ await repo.save(usuario)   │
│ await repo.findOne({id:1}) │
│ await repo.delete(id)      │
└────────────────────────────┘
```

### 🎓 Terminología importante

- **Entidad**: Clase que representa una tabla en la BD
- **Columna**: Propiedad de una entidad, corresponde a un campo de la tabla
- **Repositorio**: Objeto que gestiona operaciones sobre una entidad
- **QueryBuilder**: Herramienta para construir queries complejas
- **Migración**: Script que cambia la estructura de la BD de forma controlada
- **Relación**: Conexión entre dos entidades (1:1, 1:N, N:N)
- **ORM**: Object-Relational Mapping (mapeo de objetos a relaciones)

### 📦 Instalación rápida

```bash
# Instalar TypeORM y driver de BD
npm install typeorm pg  # para PostgreSQL
# o
npm install typeorm mysql2  # para MySQL
# o
npm install typeorm sqlite  # para SQLite

# En NestJS es más fácil:
npm install @nestjs/typeorm typeorm pg
```

### 🔌 Configuración mínima en NestJS

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'miapp',
      entities: ['src/**/*.entity.ts'],
      synchronize: true,  // Auto-crea tablas (NO en producción)
    }),
  ],
})
export class AppModule {}
```

---

## La Arquitectura en Capas

### 📊 ¿Qué es la arquitectura en capas?

Imagina que estás construyendo un restaurante:

- **Controller** = El mesero (recibe tu pedido)
- **Service** = La cocina (prepara el plato)
- **Repository** = El almacén (obtiene los ingredientes)
- **Base de Datos** = Los proveedores (entregan los ingredientes)
- **Redis** = El mostrador (guarda comidas calientes para servir rápido)

```
┌──────────────────────────────────────────────────────┐
│                                                        │
│  Cliente HTTP (navegador, móvil, otro servidor)      │
│                                                        │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│           CONTROLLER (Mesero)                        │
│   GET /users/:id  →  POST /users  →  DELETE /users  │
│   Recibe peticiones HTTP/GraphQL                     │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│          SERVICE (Cocina)                            │
│   Lógica de negocio, validaciones, transformaciones │
│   Dice qué datos necesita del repositorio            │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│          REPOSITORY (Almacén)                        │
│   Acceso a datos: save(), find(), delete()           │
│   Comunica con TypeORM                               │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│         TYPEORM (Traductor)                          │
│   Convierte objetos JavaScript a SQL                 │
│   SELECT * FROM users WHERE id = 1                   │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│      BASE DE DATOS (PostgreSQL, MySQL, SQLite)      │
│   Almacena los datos de verdad                       │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│         REDIS (Mostrador de comidas)                │
│   Cache: guarda datos usados frecuentemente          │
│   Acceso rápido (1ms vs 100ms de la BD)             │
└──────────────────────────────────────────────────────┘
```

### 🔄 El flujo de una petición

Cuando alguien llama a tu API:

```
1. Cliente → GET /api/users/5
   ↓
2. Controller.getUser(5)
   "Dame el usuario 5"
   ↓
3. Service.findUser(5)
   "Busco el usuario 5, valido que exista, preparo respuesta"
   ↓
4. Repository.findById(5)
   "Voy a la base de datos por ese usuario"
   ↓
5. TypeORM genera SQL:
   SELECT * FROM "user" WHERE "id" = 5
   ↓
6. PostgreSQL/MySQL busca en la BD
   ↓
7. Los datos regresan en inversa, transformados cada vez
   ↓
8. Cliente recibe JSON con el usuario
```

### ✅ Beneficios de esta arquitectura

| Capa | Beneficio | Por qué |
|------|-----------|--------|
| **Controller** | Separación de responsabilidades | El mesero no cocina |
| **Service** | Reutilizable | La lógica está en un lugar, varios controllers pueden usarla |
| **Repository** | Testeable | Fácil de mockear la base de datos en tests |
| **TypeORM** | Agnóstico de BD | Cambias de PostgreSQL a MySQL sin código |
| **Redis** | Rendimiento | 10x más rápido que la BD |

---

## TypeORM: Entidades

### 📦 ¿Qué es una Entidad?

Una **entidad** es la representación de una tabla en la base de datos como una clase JavaScript.

**Analogía:** Si la base de datos es un archivo Excel, la entidad es el diseño de las columnas.

```
Archivo Excel:                    Entidad en TypeORM:
┌─────────────────────────────┐
│ id │ nombre   │ email       │   class User {
├─────────────────────────────┤     @PrimaryGeneratedColumn()
│ 1  │ Juan     │ juan@...    │     id: number;
│ 2  │ María    │ maria@...   │
│ 3  │ Carlos   │ carlos@...  │     @Column()
└─────────────────────────────┘     nombre: string;

                                     @Column()
                                     email: string;
                                   }
```

### 💻 Ejemplo Básico

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')  // Nombre de la tabla en la BD
export class User {
  
  @PrimaryGeneratedColumn()
  id: number;  // Auto-incremental, clave primaria

  @Column()
  nombre: string;  // Columna normal

  @Column()
  email: string;  // Columna normal

  @Column({ nullable: true })
  telefono?: string;  // Opcional, puede ser NULL

  @Column({ default: false })
  activo: boolean = false;  // Con valor por defecto

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;  // Se llena automáticamente
}
```

### 🎯 Decoradores comunes

```typescript
@PrimaryGeneratedColumn()     // ID auto-incremental
@PrimaryGeneratedColumn('uuid')  // ID como texto único
@Column()                      // Columna normal
@Column({ nullable: true })    // Puede ser null
@Column({ unique: true })      // Valor único (no repetido)
@Column({ default: 'admin' })  // Valor por defecto
@Column({ length: 50 })        // Limita caracteres
@Column({ type: 'int' })       // Especifica tipo
@CreateDateColumn()            // Se llena con fecha actual
@UpdateDateColumn()            // Se actualiza cada cambio
```

### 📝 Ejemplo Real: Entidad Producto

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('productos')
export class Producto {

  @PrimaryGeneratedColumn('uuid')  // ID único como texto
  id: string;

  @Column()
  nombre: string;

  @Column('text')  // Para descripciones largas
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })  // Precio: 999.99
  precio: number;

  @Column({ type: 'int', default: 0 })
  stock: number = 0;

  @Column({ default: true })
  disponible: boolean = true;

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn()
  updatedAt: Date;
}
```

### 🔥 Por qué usar Entidades

| Razón | Explicación |
|-------|-------------|
| **Type Safety** | TypeScript sabe qué propiedades existen, no hay errores de typo |
| **Auto-documentación** | Mirando la clase sabes qué campos tiene la tabla |
| **Migraciones** | TypeORM puede detectar cambios automáticamente |
| **Validaciones** | Puedes añadir reglas de validación |
| **Relaciones** | Conectas tablas fácilmente |

---

## TypeORM: Relaciones

### 🔗 ¿Qué son las Relaciones?

Las relaciones conectan entidades. Así como en Excel relacionas datos con BUSCARV, en bases de datos usas Foreign Keys (claves foráneas).

**Analogía:** 
- Cada Usuario tiene Libros (1:N)
- Cada Libro pertenece a un Autor (N:1)
- Cada Alumno está en muchas Clases, cada Clase tiene muchos Alumnos (N:N)

### 1️⃣ Relación Uno a Muchos (1:N)

Un Usuario tiene muchos Posts.

```typescript
// user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Post } from './post.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @OneToMany(() => Post, post => post.usuario)  // Un User tiene muchos Posts
  posts: Post[];  // Array de posts
}

// post.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column()
  contenido: string;

  @ManyToOne(() => User, usuario => usuario.posts)  // Muchos Posts pertenecen a un User
  usuario: User;  // Una referencia al usuario

  @Column()
  usuarioId: number;  // La foreign key (clave foránea)
}
```

**En la BD:**
```sql
users table:
┌────┬────────┐
│ id │ nombre │
├────┼────────┤
│ 1  │ Juan   │
│ 2  │ María  │
└────┴────────┘

posts table:
┌────┬─────────┬──────────┬──────────┐
│ id │ titulo  │ usuarioId│ contenido│
├────┼─────────┼──────────┼──────────┤
│ 10 │ "Hola"  │ 1        │ "..."    │
│ 11 │ "Adiós" │ 1        │ "..."    │
│ 12 │ "Hola2" │ 2        │ "..."    │
└────┴─────────┴──────────┴──────────┘
```

### ✌️ Relación Muchos a Uno (N:1)

Muchos Posts pertenecen a una Categoría.

```typescript
// category.entity.ts
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @OneToMany(() => Post, post => post.categoria)
  posts: Post[];
}

// post.entity.ts
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @ManyToOne(() => Category, categoria => categoria.posts)
  categoria: Category;

  @Column()
  categoriaId: number;
}
```

### 🔀 Relación Muchos a Muchos (N:N)

Muchos Estudiantes en muchas Clases.

```typescript
// student.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Clase } from './clase.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @ManyToMany(() => Clase, clase => clase.estudiantes)
  @JoinTable({
    name: 'student_clases',  // Tabla intermedia
    joinColumn: { name: 'studentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'claseId', referencedColumnName: 'id' }
  })
  clases: Clase[];
}

// clase.entity.ts
@Entity('clases')
export class Clase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @ManyToMany(() => Student, student => student.clases)
  estudiantes: Student[];
}
```

**En la BD:**
```sql
students: id, nombre
clases: id, nombre
student_clases: studentId, claseId  (tabla intermedia)
```

### 📊 Tabla de Relaciones

| Tipo | Significado | Tabla Intermedia |
|------|-------------|------------------|
| 1:N | Un Usuario tiene muchos Posts | No necesita |
| N:1 | Muchos Posts pertenecen a un Usuario | No necesita |
| N:N | Muchos Estudiantes en muchas Clases | SÍ necesita |

### 🚀 Cargando Relaciones

```typescript
// Sin cargar relaciones (lazy loading)
const usuario = await this.usuarioRepository.findOne(1);
console.log(usuario.posts);  // undefined ❌

// Cargando relaciones con relations
const usuario = await this.usuarioRepository.findOne({
  where: { id: 1 },
  relations: ['posts', 'posts.categoria']  // Carga posts y categorías
});
console.log(usuario.posts);  // Array de posts ✅

// Con QueryBuilder (más control)
const usuario = await this.usuarioRepository
  .createQueryBuilder('usuario')
  .leftJoinAndSelect('usuario.posts', 'posts')
  .where('usuario.id = :id', { id: 1 })
  .getOne();
```

---

## TypeORM: Repositorios

### 🏦 ¿Qué es un Repositorio?

El repositorio es el **intermediario entre tu código y la base de datos**. Es como el cajero de un banco: tú le pides dinero y él accede a la bóveda.

**Analogía:** 
- Sin repositorio = código caótico con SQL por todos lados
- Con repositorio = código limpio, ordenado, reutilizable

### 💾 CRUD Básico (Create, Read, Update, Delete)

```typescript
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';

@Injectable()
export class UserRepository {
  
  constructor(
    @InjectRepository(User)
    private repository: Repository<User>
  ) {}

  // CREATE - Guardar nuevo usuario
  async crear(usuario: Partial<User>): Promise<User> {
    const nuevoUsuario = this.repository.create(usuario);  // Crea instancia
    return await this.repository.save(nuevoUsuario);  // Guarda en BD
  }

  // READ - Obtener un usuario
  async obtenerPorId(id: number): Promise<User | null> {
    return await this.repository.findOne({
      where: { id }
    });
  }

  // READ - Obtener todos
  async obtenerTodos(): Promise<User[]> {
    return await this.repository.find();
  }

  // UPDATE - Actualizar
  async actualizar(id: number, datos: Partial<User>): Promise<User> {
    await this.repository.update(id, datos);
    return this.obtenerPorId(id);
  }

  // DELETE - Eliminar
  async eliminar(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
```

### 🔍 Métodos principales

```typescript
// findOne: Busca un registro
const usuario = await repository.findOne({ where: { email: 'juan@mail.com' } });

// find: Busca múltiples registros
const usuarios = await repository.find({ where: { activo: true } });

// findByIds: Busca por array de IDs
const usuarios = await repository.findByIds([1, 2, 3]);

// count: Cuenta registros
const total = await repository.count();

// save: Guarda (insert o update)
const usuario = repository.create({ nombre: 'Juan' });
await repository.save(usuario);

// remove: Elimina (borra de verdad, devuelve la entidad)
await repository.remove(usuario);

// delete: Elimina (más eficiente, no devuelve nada)
await repository.delete({ id: 1 });

// update: Actualiza campos específicos
await repository.update({ id: 1 }, { nombre: 'Carlos' });
```

### 🛠️ QueryBuilder (Consultas Avanzadas)

Para consultas complejas, usas QueryBuilder:

```typescript
// Buscar usuarios activos creados en los últimos 7 días
const usuarios = await this.repository
  .createQueryBuilder('usuario')
  .where('usuario.activo = :activo', { activo: true })
  .andWhere('usuario.createdAt > :fecha', { fecha: new Date(Date.now() - 7*24*60*60*1000) })
  .orderBy('usuario.createdAt', 'DESC')
  .limit(10)
  .getMany();

// Con JOINs
const usuarios = await this.repository
  .createQueryBuilder('usuario')
  .leftJoinAndSelect('usuario.posts', 'posts')
  .where('posts.createdAt > :fecha', { fecha: new Date() })
  .getMany();

// Contar
const cantidad = await this.repository
  .createQueryBuilder('usuario')
  .where('usuario.activo = :activo', { activo: true })
  .getCount();
```

### 📚 Inyectando en un Service

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>  // TypeORM inyecta el repositorio
  ) {}

  async crearUsuario(nombre: string, email: string): Promise<User> {
    const usuario = this.userRepository.create({ nombre, email });
    return await this.userRepository.save(usuario);
  }

  async obtenerUsuario(id: number): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }
}
```

### ✅ Beneficios del Patrón Repository

| Beneficio | Razón |
|-----------|-------|
| **Testable** | Fácil mockear el repositorio en tests |
| **Reutilizable** | Múltiples services pueden usar el mismo repositorio |
| **Centralizado** | Toda la lógica de BD en un lugar |
| **Mantenible** | Cambios en queries sin afectar services |
| **Consistente** | Mismo patrón para todas las entidades |

---

## TypeORM: Migraciones

### 🚀 ¿Qué es una Migración?

Una **migración** es un script que cambia la estructura de la base de datos de forma controlada y repetible.

**Analogía:** 
- Sin migraciones = alguien modifica la BD manualmente, nadie sabe qué pasó
- Con migraciones = cambios documentados, versionados, que puedes revertir

```
Primer deploy:     Segunda versión:   Tercera versión:
Tabla 'users'      Tabla 'users'      Tabla 'users'
                   + columna 'telefono'  + columna 'direccion'

migration-1.sql    migration-2.sql    migration-3.sql
(create table)     (add telefono)     (add direccion)
```

### 🔧 Generando Migraciones

**Opción 1: Generación automática** (Recomendado)

```bash
# TypeORM detecta cambios en entidades y crea migración
npm run typeorm migration:generate -n NombreMigracion

# Ejemplo
npm run typeorm migration:generate -n AddPhoneToUser
```

Esto crea:
```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneToUser1629878400000 implements MigrationInterface {

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          ALTER TABLE "user" 
          ADD COLUMN "telefono" varchar
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          ALTER TABLE "user" 
          DROP COLUMN "telefono"
        `);
    }
}
```

**Opción 2: Manual** (Para cambios complejos)

```typescript
// src/migrations/1629878400000-CreateUserTable.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1629878400000 implements MigrationInterface {

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" SERIAL NOT NULL PRIMARY KEY,
                "nombre" varchar NOT NULL,
                "email" varchar NOT NULL UNIQUE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
    }
}
```
#### ¿Por qué synchronize: true es peligroso en producción con TypeORM?

synchronize: true hace que TypeORM compare las entidades con el schema real de la BD al arrancar la app y aplique los cambios automáticamente. En desarrollo es cómodo, pero en producción puede borrar columnas, recrear tablas o perder datos si haces cambios en una entidad.

La solución son las migraciones: archivos versionados y revisables que describen exactamente qué cambia en el schema. Se generan automáticamente desde los cambios en entidades (migration:generate) y se aplican de forma controlada (migration:run). También son reversibles (migration:revert).s

### ▶️ Ejecutando Migraciones

```bash
# Ejecutar todas las migraciones pendientes
npm run typeorm migration:run

# Revertir la última migración
npm run typeorm migration:revert

# Ver estado de migraciones
npm run typeorm migration:show
```

### 📋 Configuración en TypeORM

En tu `ormconfig.ts` o `app.module.ts`:

```typescript
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'miapp',
      username: 'postgres',
      password: 'password',
      entities: ['src/**/*.entity.ts'],
      migrations: ['src/migrations/*.ts'],
      
      // Auto-genera migraciones (NO USE EN PRODUCCIÓN)
      synchronize: false,
      migrationsRun: true,  // Ejecuta migraciones al iniciar
    })
  ]
})
export class AppModule {}
```

### 🎯 Workflow de Migraciones

```
1. Modificas una entidad
   @Column()
   telefono: string;  // Agregar esta columna

2. Ejecutas comando de generación
   npm run typeorm migration:generate -n AddPhone

3. TypeORM crea archivo de migración
   1629878400000-AddPhone.ts

4. Revisas la migración ✅

5. Ejecutas migraciones
   npm run typeorm migration:run

6. Base de datos actualizada ✅

7. Commiteas el archivo de migración
   git add src/migrations/
   git commit -m "Add phone column to users"
```

### ⚠️ Reglas de Oro para Migraciones

```typescript
❌ Evita:
- Borrar datos sin backup
- Cambios destructivos sin reversión
- Migraciones sin testing
- Cambiar migraciones que ya corrieron

✅ Haz:
- Siempre incluye up() y down()
- Revisa el SQL generado
- Testea en desarrollo primero
- Documenta cambios complejos
```

### 🔄 Ejemplo Completo: Agregar Relación

```typescript
// 1. Creas nueva entidad
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @ManyToOne(() => User)
  usuario: User;

  @Column()
  usuarioId: number;
}

// 2. Generas migración
npm run typeorm migration:generate -n AddPostsTable

// 3. Migración generada automáticamente
async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.createTable(
    new Table({
      name: 'posts',
      columns: [
        { name: 'id', type: 'int', isPrimary: true, isGenerated: true },
        { name: 'titulo', type: 'varchar' },
        { name: 'usuarioId', type: 'int' },
      ],
      foreignKeys: [
        new TableForeignKey({
          columnNames: ['usuarioId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'user',
          onDelete: 'CASCADE'  // Si borras usuario, borra sus posts
        })
      ]
    })
  );
}

// 4. Ejecutas
npm run typeorm migration:run

// 5. ¡Listo! Tabla creada con relación a usuarios
```

---

## 🎓 Resumen Rápido

### Controller
```typescript
@Get(':id')
async getUser(@Param('id') id: number) {
  return this.userService.findOne(id);
}
```

### Service
```typescript
async findOne(id: number) {
  const usuario = await this.userRepository.findOne({ where: { id } });
  if (!usuario) throw new NotFoundException();
  return usuario;
}
```

### Repository
```typescript
async findOne(id: number) {
  return await this.repository.findOne({ where: { id } });
}
```

### Entity
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;
}
```

### Migration
```typescript
async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.createTable(
    new Table({
      name: 'users',
      columns: [...]
    })
  );
}
```

---

## 📚 Recursos Útiles

- [Documentación TypeORM](https://typeorm.io/)
- [Documentación NestJS + TypeORM](https://docs.nestjs.com/techniques/database)
- [Migrations Guide](https://typeorm.io/migrations)

---

**¿Preguntas?** 
Cada componente es independiente y testeable. La clave es mantener cada capa con una responsabilidad clara.
