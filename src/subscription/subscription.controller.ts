import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { SubscriptionService } from './subscription.service';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { UpdateSubscriptionScheduleDto } from './dto/update-subscription-schedule.dto';

@Controller('subscription')
@UseGuards(AccessTokenGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionService.create(req.user.userId, dto);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.subscriptionService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') subscriptionId: string,
  ) {
    return this.subscriptionService.findOne(req.user.userId, subscriptionId);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') subscriptionId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.update(
      req.user.userId,
      subscriptionId,
      dto,
    );
  }

  @Get(':id/schedule')
  async getSchedule(
    @Req() req: AuthenticatedRequest,
    @Param('id') subscriptionId: string,
  ) {
    return this.subscriptionService.getSchedule(
      req.user.userId,
      subscriptionId,
    );
  }

  @Put(':id/schedule')
  async updateSchedule(
    @Req() req: AuthenticatedRequest,
    @Param('id') subscriptionId: string,
    @Body() dto: UpdateSubscriptionScheduleDto,
  ) {
    return this.subscriptionService.updateSchedule(
      req.user.userId,
      subscriptionId,
      dto,
    );
  }
}
