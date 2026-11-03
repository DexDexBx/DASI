import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { FirebaseAdminService } from './firebase-admin.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, FirebaseAdminService],
  exports: [AuthService],
})
export class AuthModule {}
