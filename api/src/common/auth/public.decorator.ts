import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca un controlador o endpoint como accesible sin JWT. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
