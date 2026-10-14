import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session-user';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('api/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@CurrentUser() me: SessionUser) {
    return this.users.list(me);
  }

  @Post()
  create(@CurrentUser() me: SessionUser, @Body() dto: CreateUserDto) {
    return this.users.create(me, dto);
  }

  @Put(':username')
  update(
    @CurrentUser() me: SessionUser,
    @Param('username') username: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(me, username, dto);
  }

  @Delete(':username')
  remove(@CurrentUser() me: SessionUser, @Param('username') username: string) {
    return this.users.remove(me, username);
  }
}
