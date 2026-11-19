import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DayOfWeek, Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import SUBSCRIPTION_MESSAGES from 'src/common/constants/subscription.message';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { UpdateSubscriptionScheduleDto } from './dto/update-subscription-schedule.dto';
import { AddSkipDateDto } from './dto/add-skip-date.dto';

const DAY_OF_WEEK_MAP: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

function toCalendarDateString(
  date: Date | string,
  timeZone = 'Asia/Kolkata',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSubscriptionDto) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: dto.productId,
      },
    });

    if (!product) {
      throw new NotFoundException(SUBSCRIPTION_MESSAGES.PRODUCT_NOT_FOUND);
    }

    if (product.status !== 'ACTIVE' || product.availability !== 'AVAILABLE') {
      throw new BadRequestException(
        SUBSCRIPTION_MESSAGES.PRODUCT_NOT_AVAILABLE,
      );
    }

    return this.prisma.subscription.create({
      data: {
        userId,
        productId: dto.productId,
        startDate: new Date(dto.startDate),
      },
      include: {
        product: true,
        schedules: true,
        skipDates: true,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.subscription.findMany({
      where: {
        userId,
      },
      include: {
        product: true,
        schedules: true,
        skipDates: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        product: true,
        schedules: true,
        skipDates: true,
      },
    });
    if (!subscription) {
      throw new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND);
    }
    return subscription;
  }

  async update(userId: string, id: string, dto: UpdateSubscriptionDto) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!subscription) {
      throw new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND);
    }

    let endDate: Date | undefined;
    if (dto.endDate) {
      endDate = new Date(dto.endDate);
      if (endDate < subscription.startDate) {
        throw new BadRequestException(
          SUBSCRIPTION_MESSAGES.END_DATE_BEFORE_START_DATE,
        );
      }
    }

    return this.prisma.subscription.update({
      where: {
        id,
      },
      data: {
        endDate: dto.endDate ? endDate : undefined,
      },
      include: {
        product: true,
        schedules: true,
        skipDates: true,
      },
    });
  }

  async getSchedule(userId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!subscription) {
      throw new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND);
    }

    return this.prisma.subscriptionSchedule.findMany({
      where: {
        subscriptionId,
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });
  }

  async updateSchedule(
    userId: string,
    subscriptionId: string,
    dto: UpdateSubscriptionScheduleDto,
  ) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!subscription) {
      throw new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND);
    }

    const days = dto.schedule.map((item) => item.dayOfWeek);

    const uniqueDays = new Set(days);

    if (uniqueDays.size !== days.length) {
      throw new BadRequestException(SUBSCRIPTION_MESSAGES.DUPLICATE_DAYS_FOUND);
    }

    await this.prisma.$transaction([
      this.prisma.subscriptionSchedule.deleteMany({
        where: {
          subscriptionId,
        },
      }),

      this.prisma.subscriptionSchedule.createMany({
        data: dto.schedule.map((item) => ({
          subscriptionId,
          dayOfWeek: item.dayOfWeek,
          quantity: item.quantity,
        })),
      }),
    ]);

    return this.prisma.subscriptionSchedule.findMany({
      where: {
        subscriptionId,
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });
  }

  async pause(userId: string, id: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!subscription) {
      throw new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND);
    }

    if (subscription.status === SubscriptionStatus.PAUSED) {
      throw new BadRequestException(
        SUBSCRIPTION_MESSAGES.SUBSCRIPTION_ALREADY_PAUSED,
      );
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException(
        SUBSCRIPTION_MESSAGES.CANNOT_PAUSE_CANCELLED_SUBSCRIPTION,
      );
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        SUBSCRIPTION_MESSAGES.ONLY_ACTIVE_CAN_BE_PAUSED,
      );
    }

    return this.prisma.subscription.update({
      where: {
        id,
      },
      data: {
        status: SubscriptionStatus.PAUSED,
      },
      include: {
        product: true,
        schedules: true,
        skipDates: true,
      },
    });
  }

  async resume(userId: string, id: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!subscription) {
      throw new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND);
    }

    if (subscription.status === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        SUBSCRIPTION_MESSAGES.SUBSCRIPTION_ALREADY_ACTIVE,
      );
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException(
        SUBSCRIPTION_MESSAGES.CANNOT_RESUME_CANCELLED_SUBSCRIPTION,
      );
    }

    if (subscription.status !== SubscriptionStatus.PAUSED) {
      throw new BadRequestException(
        SUBSCRIPTION_MESSAGES.ONLY_PAUSED_CAN_BE_RESUMED,
      );
    }

    return this.prisma.subscription.update({
      where: {
        id,
      },
      data: {
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        product: true,
        schedules: true,
        skipDates: true,
      },
    });
  }

  async cancel(userId: string, id: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!subscription) {
      throw new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND);
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException(
        SUBSCRIPTION_MESSAGES.SUBSCRIPTION_ALREADY_CANCELLED,
      );
    }

    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.PAUSED
    ) {
      throw new BadRequestException(
        SUBSCRIPTION_MESSAGES.CANNOT_CANCEL_SUBSCRIPTION,
      );
    }

    return this.prisma.subscription.update({
      where: {
        id,
      },
      data: {
        status: SubscriptionStatus.CANCELLED,
      },
      include: {
        product: true,
        schedules: true,
        skipDates: true,
      },
    });
  }

  async addSkipDate(
    userId: string,
    subscriptionId: string,
    dto: AddSkipDateDto,
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        id: subscriptionId,
      },
      include: {
        schedules: true,
      },
    });

    if (!subscription || subscription.userId !== userId) {
      throw new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND);
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        SUBSCRIPTION_MESSAGES.ONLY_ACTIVE_CAN_ADD_SKIP_DATE,
      );
    }

    if (!dto.date || typeof dto.date !== 'string') {
      throw new BadRequestException(SUBSCRIPTION_MESSAGES.INVALID_DATE_FORMAT);
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dto.date);
    if (!match) {
      throw new BadRequestException(SUBSCRIPTION_MESSAGES.INVALID_DATE_FORMAT);
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    const normalizedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    if (
      normalizedDate.getUTCFullYear() !== year ||
      normalizedDate.getUTCMonth() !== month - 1 ||
      normalizedDate.getUTCDate() !== day
    ) {
      throw new BadRequestException(SUBSCRIPTION_MESSAGES.INVALID_DATE_FORMAT);
    }

    const todayStr = toCalendarDateString(new Date());
    if (dto.date < todayStr) {
      throw new BadRequestException(
        SUBSCRIPTION_MESSAGES.CANNOT_SKIP_PAST_DATE,
      );
    }

    const startDateStr = toCalendarDateString(subscription.startDate);
    if (dto.date < startDateStr) {
      throw new BadRequestException(
        SUBSCRIPTION_MESSAGES.SKIP_DATE_BEFORE_START_DATE,
      );
    }

    if (subscription.endDate) {
      const endDateStr = toCalendarDateString(subscription.endDate);
      if (dto.date > endDateStr) {
        throw new BadRequestException(
          SUBSCRIPTION_MESSAGES.SKIP_DATE_AFTER_END_DATE,
        );
      }
    }

    const dayOfWeek = DAY_OF_WEEK_MAP[normalizedDate.getUTCDay()];
    const schedules = subscription.schedules || [];
    const isScheduledDay = schedules.some(
      (schedule) =>
        schedule.dayOfWeek === dayOfWeek &&
        (schedule.quantity === undefined || schedule.quantity > 0),
    );

    if (!isScheduledDay) {
      throw new BadRequestException(SUBSCRIPTION_MESSAGES.DATE_NOT_IN_SCHEDULE);
    }

    const existingSkipDate = await this.prisma.subscriptionSkipDate.findUnique({
      where: {
        subscriptionId_date: {
          subscriptionId,
          date: normalizedDate,
        },
      },
    });

    if (existingSkipDate) {
      throw new BadRequestException(SUBSCRIPTION_MESSAGES.DUPLICATE_SKIP_DATE);
    }

    try {
      return await this.prisma.subscriptionSkipDate.create({
        data: {
          subscriptionId,
          date: normalizedDate,
          reason: dto.reason,
        },
      });
    } catch (error: unknown) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002') ||
        (typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code?: unknown }).code === 'P2002')
      ) {
        throw new BadRequestException(
          SUBSCRIPTION_MESSAGES.DUPLICATE_SKIP_DATE,
        );
      }
      throw error;
    }
  }
}
