--
-- PostgreSQL database dump
-- (Datos de ejemplo / demo — sin informacion real de clientes ni empleados)
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: areas; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.areas (id, nombre, icono, color, activo, orden) VALUES (1, 'Producción', '⚙', '#d97706', true, 1);
INSERT INTO public.areas (id, nombre, icono, color, activo, orden) VALUES (2, 'Calidad', '✔', '#16a34a', true, 2);
INSERT INTO public.areas (id, nombre, icono, color, activo, orden) VALUES (3, 'Ingeniería', '📐', '#1d6fde', true, 3);
INSERT INTO public.areas (id, nombre, icono, color, activo, orden) VALUES (4, 'Mantenimiento', '🔧', '#7c3aed', true, 4);


--
-- Data for Name: dispositivos; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: empleados; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.empleados (id, nombre, activo, created_at, departamento) VALUES (1, 'Ana Torres', true, '2026-04-22 21:57:07.835838', 'Calidad');
INSERT INTO public.empleados (id, nombre, activo, created_at, departamento) VALUES (2, 'Luis Ramirez', true, '2026-04-22 21:57:07.835838', 'Calidad');
INSERT INTO public.empleados (id, nombre, activo, created_at, departamento) VALUES (3, 'Sofia Mendoza', true, '2026-04-22 21:57:07.835838', NULL);
INSERT INTO public.empleados (id, nombre, activo, created_at, departamento) VALUES (4, 'Carlos Vega', true, '2026-04-22 21:57:07.835838', NULL);
INSERT INTO public.empleados (id, nombre, activo, created_at, departamento) VALUES (5, 'Diana Flores', true, '2026-04-22 21:57:07.835838', NULL);
INSERT INTO public.empleados (id, nombre, activo, created_at, departamento) VALUES (6, 'Pedro Salinas', true, '2026-04-22 21:57:07.835838', NULL);
INSERT INTO public.empleados (id, nombre, activo, created_at, departamento) VALUES (7, 'Laura Nunez', true, '2026-04-22 21:57:07.835838', NULL);
INSERT INTO public.empleados (id, nombre, activo, created_at, departamento) VALUES (8, 'Miguel Castro', true, '2026-04-22 21:57:07.835838', NULL);
INSERT INTO public.empleados (id, nombre, activo, created_at, departamento) VALUES (9, 'Karla Ortiz', true, '2026-04-22 21:57:07.835838', NULL);
INSERT INTO public.empleados (id, nombre, activo, created_at, departamento) VALUES (10, 'Hector Pena', true, '2026-04-22 21:57:07.835838', NULL);
INSERT INTO public.empleados (id, nombre, activo, created_at, departamento) VALUES (11, 'Paula Reyes', true, '2026-04-22 21:57:07.835838', NULL);
INSERT INTO public.empleados (id, nombre, activo, created_at, departamento) VALUES (12, 'Ivan Morales', true, '2026-04-22 21:57:07.835838', NULL);
INSERT INTO public.empleados (id, nombre, activo, created_at, departamento) VALUES (13, 'Renata Cruz', true, '2026-05-13 14:03:53.318508', NULL);


--
-- Data for Name: piezas; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.piezas (id, no_parte, cliente, descripcion, parte_cliente, nivel_dwg, nivel_cad, imagen_url, activo, created_at, archivos, tiempo_medicion, tiempos_extra) VALUES (1, 'DEMO-1001', 'Cliente A', 'Pieza de ejemplo 1', 'REF-0001', 'A / 01.01.2024', '0', '/imagenes/5626.png', true, '2026-04-22 21:57:07.839701', '[]', 30, '{}');
INSERT INTO public.piezas (id, no_parte, cliente, descripcion, parte_cliente, nivel_dwg, nivel_cad, imagen_url, activo, created_at, archivos, tiempo_medicion, tiempos_extra) VALUES (2, 'DEMO-1002', 'Cliente B', 'Pieza de ejemplo 2', 'REF-0002', 'A / 01.01.2024', '0', '/imagenes/4984.png', true, '2026-04-22 21:57:07.839701', '[]', 30, '{}');
INSERT INTO public.piezas (id, no_parte, cliente, descripcion, parte_cliente, nivel_dwg, nivel_cad, imagen_url, activo, created_at, archivos, tiempo_medicion, tiempos_extra) VALUES (3, 'DEMO-1003', 'Cliente C', 'Pieza de ejemplo 3', 'REF-0003', 'A / 01.01.2024', '0', '/imagenes/5540.png', true, '2026-04-22 21:57:07.839701', '[]', 30, '{}');
INSERT INTO public.piezas (id, no_parte, cliente, descripcion, parte_cliente, nivel_dwg, nivel_cad, imagen_url, activo, created_at, archivos, tiempo_medicion, tiempos_extra) VALUES (4, 'DEMO-1004', 'Cliente B', 'Pieza de ejemplo 4', 'REF-0004', 'A / 01.01.2024', '0', NULL, false, '2026-04-22 22:49:04.59623', '[]', 30, '{}');


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
-- Usuario de demostracion: username "demo", password "Demo1234!"
--

INSERT INTO public.usuarios (id, nombre, username, password_hash, activo, created_at) VALUES (1, 'Usuario Demo', 'demo', '$2b$10$8R7JTOM6bGHWD2rTH4wq0.YWuZILhRhLBHYBxR1NabOhidlR/ESke', true, '2026-04-22 21:57:07.828551');


--
-- Name: areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.areas_id_seq', 6, true);


--
-- Name: dispositivos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dispositivos_id_seq', 1, false);


--
-- Name: empleados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.empleados_id_seq', 15, true);


--
-- Name: piezas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.piezas_id_seq', 5, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 1, true);


--
-- PostgreSQL database dump complete
--
