import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { UsersBootstrapService } from './users-bootstrap.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, UsersBootstrapService],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
