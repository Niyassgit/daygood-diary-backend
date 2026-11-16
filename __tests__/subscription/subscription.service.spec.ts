import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  DayOfWeek,
  ProductAvailability,
  ProductStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { PrismaService } from 'src/prisma/prisma.service';
import SUBSCRIPTION_MESSAGES from 'src/common/constants/subscription.message';
import { CreateSubscriptionDto } from 'src/subscription/dto/create-subscription.dto';
import { UpdateSubscriptionDto } from 'src/subscription/dto/update-subscription.dto';
import { UpdateSubscriptionScheduleDto } from 'src/subscription/dto/update-subscription-schedule.dto';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let prisma: {
    product: { findUnique: jest.Mock };
    subscription: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    subscriptionSchedule: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    subscriptionSchedule: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-123';
    const createDto: CreateSubscriptionDto = {
      productId: 'prod-456',
      startDate: '2026-10-01T00:00:00.000Z',
    };

    it('should successfully create a subscription when product exists, is active, and available', async () => {
      const mockProduct = {
        id: 'prod-456',
        name: 'Fresh Cow Milk',
        status: ProductStatus.ACTIVE,
        availability: ProductAvailability.AVAILABLE,
      };

      const mockCreatedSubscription = {
        id: 'sub-789',
        userId,
        productId: createDto.productId,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(createDto.startDate),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: mockProduct,
        schedules: [],
        skipDates: [],
      };

      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.subscription.create.mockResolvedValue(mockCreatedSubscription);

      const result = await service.create(userId, createDto);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.productId },
      });
      expect(prisma.subscription.create).toHaveBeenCalledWith({
        data: {
          userId,
          productId: createDto.productId,
          startDate: new Date(createDto.startDate),
        },
        include: {
          product: true,
          schedules: true,
          skipDates: true,
        },
      });
      expect(result).toEqual(mockCreatedSubscription);
    });

    it('should throw NotFoundException if product is not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.PRODUCT_NOT_FOUND),
      );
      expect(prisma.subscription.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if product status is INACTIVE', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'prod-456',
        status: ProductStatus.INACTIVE,
        availability: ProductAvailability.AVAILABLE,
      });

      await expect(service.create(userId, createDto)).rejects.toThrow(
        new BadRequestException(SUBSCRIPTION_MESSAGES.PRODUCT_NOT_AVAILABLE),
      );
      expect(prisma.subscription.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if product availability is UNAVAILABLE', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'prod-456',
        status: ProductStatus.ACTIVE,
        availability: ProductAvailability.UNAVAILABLE,
      });

      await expect(service.create(userId, createDto)).rejects.toThrow(
        new BadRequestException(SUBSCRIPTION_MESSAGES.PRODUCT_NOT_AVAILABLE),
      );
      expect(prisma.subscription.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const userId = 'user-123';

    it('should return all subscriptions for the authenticated user ordered by createdAt desc', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          userId,
          productId: 'prod-1',
          status: SubscriptionStatus.ACTIVE,
          startDate: new Date('2026-09-01'),
          endDate: null,
          product: { id: 'prod-1', name: 'Milk' },
          schedules: [],
          skipDates: [],
        },
      ];

      prisma.subscription.findMany.mockResolvedValue(mockSubscriptions);

      const result = await service.findAll(userId);

      expect(prisma.subscription.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          product: true,
          schedules: true,
          skipDates: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockSubscriptions);
    });

    it('should return an empty array if the user has no subscriptions', async () => {
      prisma.subscription.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    const userId = 'user-123';
    const subscriptionId = 'sub-1';

    it('should return the subscription if found and owned by the user', async () => {
      const mockSubscription = {
        id: subscriptionId,
        userId,
        productId: 'prod-1',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date('2026-09-01'),
        endDate: null,
        product: { id: 'prod-1', name: 'Milk' },
        schedules: [],
        skipDates: [],
      };

      prisma.subscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await service.findOne(userId, subscriptionId);

      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          id: subscriptionId,
          userId,
        },
        include: {
          product: true,
          schedules: true,
          skipDates: true,
        },
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should throw NotFoundException if subscription is not found or does not belong to user', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);

      await expect(service.findOne(userId, subscriptionId)).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );
    });
  });

  describe('update', () => {
    const userId = 'user-123';
    const subscriptionId = 'sub-1';
    const mockExistingSubscription = {
      id: subscriptionId,
      userId,
      productId: 'prod-1',
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: null,
    };

    it('should successfully update subscription when endDate is after startDate', async () => {
      const updateDto: UpdateSubscriptionDto = {
        endDate: '2026-10-01T00:00:00.000Z',
      };
      const mockUpdatedSubscription = {
        ...mockExistingSubscription,
        endDate: new Date(updateDto.endDate!),
        product: {},
        schedules: [],
        skipDates: [],
      };

      prisma.subscription.findFirst.mockResolvedValue(mockExistingSubscription);
      prisma.subscription.update.mockResolvedValue(mockUpdatedSubscription);

      const result = await service.update(userId, subscriptionId, updateDto);

      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: { id: subscriptionId, userId },
      });
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        data: {
          endDate: new Date(updateDto.endDate!),
        },
        include: {
          product: true,
          schedules: true,
          skipDates: true,
        },
      });
      expect(result).toEqual(mockUpdatedSubscription);
    });

    it('should allow endDate on the exact same date as startDate', async () => {
      const updateDto: UpdateSubscriptionDto = {
        endDate: '2026-09-01T00:00:00.000Z',
      };
      prisma.subscription.findFirst.mockResolvedValue(mockExistingSubscription);
      prisma.subscription.update.mockResolvedValue({
        ...mockExistingSubscription,
        endDate: new Date(updateDto.endDate!),
      });

      await expect(
        service.update(userId, subscriptionId, updateDto),
      ).resolves.toBeDefined();
    });

    it('should throw BadRequestException if endDate is earlier than startDate', async () => {
      const updateDto: UpdateSubscriptionDto = {
        endDate: '2026-08-31T23:59:59.000Z',
      };
      prisma.subscription.findFirst.mockResolvedValue(mockExistingSubscription);

      await expect(
        service.update(userId, subscriptionId, updateDto),
      ).rejects.toThrow(
        new BadRequestException(
          SUBSCRIPTION_MESSAGES.END_DATE_BEFORE_START_DATE,
        ),
      );
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if subscription does not exist or userId does not match', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);

      await expect(
        service.update(userId, subscriptionId, { endDate: '2026-10-01' }),
      ).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('should successfully update when endDate is omitted (undefined)', async () => {
      const updateDto: UpdateSubscriptionDto = {};
      prisma.subscription.findFirst.mockResolvedValue(mockExistingSubscription);
      prisma.subscription.update.mockResolvedValue(mockExistingSubscription);

      await service.update(userId, subscriptionId, updateDto);

      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        data: {
          endDate: undefined,
        },
        include: {
          product: true,
          schedules: true,
          skipDates: true,
        },
      });
    });
  });

  describe('getSchedule', () => {
    const userId = 'user-123';
    const subscriptionId = 'sub-1';

    it('should return weekly schedule items ordered by dayOfWeek asc', async () => {
      const mockSchedule = [
        {
          id: 'sch-1',
          subscriptionId,
          dayOfWeek: DayOfWeek.MONDAY,
          quantity: 2,
        },
        {
          id: 'sch-2',
          subscriptionId,
          dayOfWeek: DayOfWeek.WEDNESDAY,
          quantity: 1,
        },
      ];

      prisma.subscription.findFirst.mockResolvedValue({
        id: subscriptionId,
        userId,
      });
      prisma.subscriptionSchedule.findMany.mockResolvedValue(mockSchedule);

      const result = await service.getSchedule(userId, subscriptionId);

      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: { id: subscriptionId, userId },
      });
      expect(prisma.subscriptionSchedule.findMany).toHaveBeenCalledWith({
        where: { subscriptionId },
        orderBy: { dayOfWeek: 'asc' },
      });
      expect(result).toEqual(mockSchedule);
    });

    it('should throw NotFoundException if subscription does not exist or user is not owner', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);

      await expect(service.getSchedule(userId, subscriptionId)).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );
      expect(prisma.subscriptionSchedule.findMany).not.toHaveBeenCalled();
    });
  });

  describe('updateSchedule', () => {
    const userId = 'user-123';
    const subscriptionId = 'sub-1';
    const updateScheduleDto: UpdateSubscriptionScheduleDto = {
      schedule: [
        { dayOfWeek: DayOfWeek.MONDAY, quantity: 2 },
        { dayOfWeek: DayOfWeek.FRIDAY, quantity: 3 },
      ],
    };

    it('should replace schedule inside a database transaction and return updated schedule', async () => {
      const mockUpdatedSchedule = [
        {
          id: 'sch-1',
          subscriptionId,
          dayOfWeek: DayOfWeek.MONDAY,
          quantity: 2,
        },
        {
          id: 'sch-2',
          subscriptionId,
          dayOfWeek: DayOfWeek.FRIDAY,
          quantity: 3,
        },
      ];

      prisma.subscription.findFirst.mockResolvedValue({
        id: subscriptionId,
        userId,
      });
      prisma.subscriptionSchedule.deleteMany.mockReturnValue('deleteManyOp');
      prisma.subscriptionSchedule.createMany.mockReturnValue('createManyOp');
      prisma.$transaction.mockResolvedValue([{}, {}]);
      prisma.subscriptionSchedule.findMany.mockResolvedValue(
        mockUpdatedSchedule,
      );

      const result = await service.updateSchedule(
        userId,
        subscriptionId,
        updateScheduleDto,
      );

      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: { id: subscriptionId, userId },
      });
      expect(prisma.subscriptionSchedule.deleteMany).toHaveBeenCalledWith({
        where: { subscriptionId },
      });
      expect(prisma.subscriptionSchedule.createMany).toHaveBeenCalledWith({
        data: [
          { subscriptionId, dayOfWeek: DayOfWeek.MONDAY, quantity: 2 },
          { subscriptionId, dayOfWeek: DayOfWeek.FRIDAY, quantity: 3 },
        ],
      });
      expect(prisma.$transaction).toHaveBeenCalledWith([
        'deleteManyOp',
        'createManyOp',
      ]);
      expect(prisma.subscriptionSchedule.findMany).toHaveBeenCalledWith({
        where: { subscriptionId },
        orderBy: { dayOfWeek: 'asc' },
      });
      expect(result).toEqual(mockUpdatedSchedule);
    });

    it('should throw NotFoundException if subscription does not exist or user is not owner', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSchedule(userId, subscriptionId, updateScheduleDto),
      ).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if schedule contains duplicate days of week', async () => {
      const duplicateDaysDto: UpdateSubscriptionScheduleDto = {
        schedule: [
          { dayOfWeek: DayOfWeek.MONDAY, quantity: 2 },
          { dayOfWeek: DayOfWeek.MONDAY, quantity: 1 },
        ],
      };

      prisma.subscription.findFirst.mockResolvedValue({
        id: subscriptionId,
        userId,
      });

      await expect(
        service.updateSchedule(userId, subscriptionId, duplicateDaysDto),
      ).rejects.toThrow(
        new BadRequestException(SUBSCRIPTION_MESSAGES.DUPLICATE_DAYS_FOUND),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('pause', () => {
    const userId = 'user-123';
    const subscriptionId = 'sub-1';
    const mockExistingSubscription = {
      id: subscriptionId,
      userId,
      productId: 'prod-1',
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully pause an ACTIVE subscription and preserve schedules and skip dates', async () => {
      const mockSchedules = [
        {
          id: 'sch-1',
          subscriptionId,
          dayOfWeek: DayOfWeek.MONDAY,
          quantity: 2,
        },
      ];
      const mockSkipDates = [
        {
          id: 'skip-1',
          subscriptionId,
          date: new Date('2026-09-15'),
          reason: 'Out of town',
        },
      ];

      const mockPausedSubscription = {
        ...mockExistingSubscription,
        status: SubscriptionStatus.PAUSED,
        product: { id: 'prod-1', name: 'Fresh Milk' },
        schedules: mockSchedules,
        skipDates: mockSkipDates,
      };

      prisma.subscription.findFirst.mockResolvedValue(mockExistingSubscription);
      prisma.subscription.update.mockResolvedValue(mockPausedSubscription);

      const result = await service.pause(userId, subscriptionId);

      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: { id: subscriptionId, userId },
      });
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.PAUSED,
        },
        include: {
          product: true,
          schedules: true,
          skipDates: true,
        },
      });
      expect(result).toEqual(mockPausedSubscription);
      expect(result.status).toBe(SubscriptionStatus.PAUSED);
      expect(result.schedules).toEqual(mockSchedules);
      expect(result.skipDates).toEqual(mockSkipDates);
    });

    it('should throw NotFoundException if subscription does not exist or user is not owner', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);

      await expect(service.pause(userId, subscriptionId)).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if subscription is already PAUSED', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        ...mockExistingSubscription,
        status: SubscriptionStatus.PAUSED,
      });

      await expect(service.pause(userId, subscriptionId)).rejects.toThrow(
        new BadRequestException(
          SUBSCRIPTION_MESSAGES.SUBSCRIPTION_ALREADY_PAUSED,
        ),
      );
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if subscription is CANCELLED', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        ...mockExistingSubscription,
        status: SubscriptionStatus.CANCELLED,
      });

      await expect(service.pause(userId, subscriptionId)).rejects.toThrow(
        new BadRequestException(
          SUBSCRIPTION_MESSAGES.CANNOT_PAUSE_CANCELLED_SUBSCRIPTION,
        ),
      );
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });
  });

  describe('resume', () => {
    const userId = 'user-123';
    const subscriptionId = 'sub-1';
    const mockExistingSubscription = {
      id: subscriptionId,
      userId,
      productId: 'prod-1',
      status: SubscriptionStatus.PAUSED,
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully resume a PAUSED subscription and preserve schedules and skip dates', async () => {
      const mockSchedules = [
        {
          id: 'sch-1',
          subscriptionId,
          dayOfWeek: DayOfWeek.MONDAY,
          quantity: 2,
        },
      ];
      const mockSkipDates = [
        {
          id: 'skip-1',
          subscriptionId,
          date: new Date('2026-09-15'),
          reason: 'Out of town',
        },
      ];

      const mockResumedSubscription = {
        ...mockExistingSubscription,
        status: SubscriptionStatus.ACTIVE,
        product: { id: 'prod-1', name: 'Fresh Milk' },
        schedules: mockSchedules,
        skipDates: mockSkipDates,
      };

      prisma.subscription.findFirst.mockResolvedValue(mockExistingSubscription);
      prisma.subscription.update.mockResolvedValue(mockResumedSubscription);

      const result = await service.resume(userId, subscriptionId);

      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: { id: subscriptionId, userId },
      });
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
        },
        include: {
          product: true,
          schedules: true,
          skipDates: true,
        },
      });
      expect(result).toEqual(mockResumedSubscription);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result.schedules).toEqual(mockSchedules);
      expect(result.skipDates).toEqual(mockSkipDates);
    });

    it('should throw NotFoundException if subscription does not exist or user is not owner', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);

      await expect(service.resume(userId, subscriptionId)).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if subscription is already ACTIVE', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        ...mockExistingSubscription,
        status: SubscriptionStatus.ACTIVE,
      });

      await expect(service.resume(userId, subscriptionId)).rejects.toThrow(
        new BadRequestException(
          SUBSCRIPTION_MESSAGES.SUBSCRIPTION_ALREADY_ACTIVE,
        ),
      );
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if subscription is CANCELLED', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        ...mockExistingSubscription,
        status: SubscriptionStatus.CANCELLED,
      });

      await expect(service.resume(userId, subscriptionId)).rejects.toThrow(
        new BadRequestException(
          SUBSCRIPTION_MESSAGES.CANNOT_RESUME_CANCELLED_SUBSCRIPTION,
        ),
      );
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });
  });
});
