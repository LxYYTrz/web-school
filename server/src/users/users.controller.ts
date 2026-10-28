/**
 * 用户管理 HTTP 入口，类级 AuthGuard 要求有效会话。
 * list/create/update/remove 从路径、正文、CurrentUser 取参数，交给 UsersService；具体操作权限在服务中分别检查。
 */
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
// UsersController 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
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
  // 按本行数据更新当前状态或对象字段。
    @CurrentUser() me: SessionUser,
    @Param('username') username: string,
    @Body() dto: UpdateUserDto,
  ) {
  // 上方参数列表在此结束，下面开始方法的具体处理逻辑
    return this.users.update(me, username, dto);
  }

  @Delete(':username')
  remove(@CurrentUser() me: SessionUser, @Param('username') username: string) {
    return this.users.remove(me, username);
  }
}
