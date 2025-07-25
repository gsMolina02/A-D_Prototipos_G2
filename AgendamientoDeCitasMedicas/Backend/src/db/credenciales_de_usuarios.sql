PGDMP                      }            credenciales_de_usuarios    17.2    17.2     �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16530    credenciales_de_usuarios    DATABASE     �   CREATE DATABASE credenciales_de_usuarios WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Spanish_Ecuador.1252';
 (   DROP DATABASE credenciales_de_usuarios;
                     postgres    false            �            1259    16532    users    TABLE       CREATE TABLE public.users (
    id integer NOT NULL,
    nombre character varying(100),
    apellido character varying(100),
    cedula character varying(20),
    email character varying(100),
    telefono character varying(20),
    "contraseña" character varying(255),
    rol character varying(50),
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_rol_check CHECK (((rol)::text = ANY ((ARRAY['paciente'::character varying, 'medico'::character varying])::text[])))
);
    DROP TABLE public.users;
       public         heap r       postgres    false            �            1259    16531    users_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.users_id_seq;
       public               postgres    false    218            �           0    0    users_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
          public               postgres    false    217            W           2604    16535    users id    DEFAULT     d   ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
 7   ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    217    218    218            �          0    16532    users 
   TABLE DATA           r   COPY public.users (id, nombre, apellido, cedula, email, telefono, "contraseña", rol, fecha_registro) FROM stdin;
    public               postgres    false    218   �       �           0    0    users_id_seq    SEQUENCE SET     :   SELECT pg_catalog.setval('public.users_id_seq', 2, true);
          public               postgres    false    217            [           2606    16543    users users_cedula_key 
   CONSTRAINT     S   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_cedula_key UNIQUE (cedula);
 @   ALTER TABLE ONLY public.users DROP CONSTRAINT users_cedula_key;
       public                 postgres    false    218            ]           2606    16545    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 postgres    false    218            _           2606    16541    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    218            �   �   x�m�KJ�@@�է�LSU�Kg5;A<� EO���;�#�\z���a�n�#x��M><�q���s�;r�Nw�]g�zݭ��;L�����Ȫ�_y�Z�a��*0K�n
����O�{�zBˎ��axܥ���g�o v>��e��_�K�yT[�t�x1��Q��@8Q�1��[3�d^�1��>�     