import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  DayOfWeek,
  Prisma,
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
import { AddSkipDateDto } from 'src/subscription/dto/add-skip-date.dto';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let prisma: {
    product: { findUnique: jest.Mock };
    subscription: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    subscriptionSchedule: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    subscriptionSkipDate: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
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
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    subscriptionSchedule: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    subscriptionSkipDate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
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

  describe('cancel', () => {
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

    it('should successfully cancel an ACTIVE subscription and preserve schedules and skip dates', async () => {
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

      const mockCancelledSubscription = {
        ...mockExistingSubscription,
        status: SubscriptionStatus.CANCELLED,
        product: { id: 'prod-1', name: 'Fresh Milk' },
        schedules: mockSchedules,
        skipDates: mockSkipDates,
      };

      prisma.subscription.findFirst.mockResolvedValue(mockExistingSubscription);
      prisma.subscription.update.mockResolvedValue(mockCancelledSubscription);

      const result = await service.cancel(userId, subscriptionId);

      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: { id: subscriptionId, userId },
      });
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.CANCELLED,
        },
        include: {
          product: true,
          schedules: true,
          skipDates: true,
        },
      });
      expect(result).toEqual(mockCancelledSubscription);
      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
      expect(result.schedules).toEqual(mockSchedules);
      expect(result.skipDates).toEqual(mockSkipDates);
    });

    it('should successfully cancel a PAUSED subscription and preserve schedules and skip dates', async () => {
      const mockPausedSubscription = {
        ...mockExistingSubscription,
        status: SubscriptionStatus.PAUSED,
      };
      const mockCancelledSubscription = {
        ...mockExistingSubscription,
        status: SubscriptionStatus.CANCELLED,
        product: { id: 'prod-1', name: 'Fresh Milk' },
        schedules: [],
        skipDates: [],
      };

      prisma.subscription.findFirst.mockResolvedValue(mockPausedSubscription);
      prisma.subscription.update.mockResolvedValue(mockCancelledSubscription);

      const result = await service.cancel(userId, subscriptionId);

      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: { id: subscriptionId, userId },
      });
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.CANCELLED,
        },
        include: {
          product: true,
          schedules: true,
          skipDates: true,
        },
      });
      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
    });

    it('should throw NotFoundException if subscription does not exist or user is not owner', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);

      await expect(service.cancel(userId, subscriptionId)).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if subscription is already CANCELLED', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        ...mockExistingSubscription,
        status: SubscriptionStatus.CANCELLED,
      });

      await expect(service.cancel(userId, subscriptionId)).rejects.toThrow(
        new BadRequestException(
          SUBSCRIPTION_MESSAGES.SUBSCRIPTION_ALREADY_CANCELLED,
        ),
      );
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });
  });

  describe('addSkipDate', () => {
    const userId = 'user-123';
    const subscriptionId = 'sub-1';
    const validDto: AddSkipDateDto = {
      date: '2026-11-25',
      reason: 'Customer not available',
    };

    const mockActiveSubscription = {
      id: subscriptionId,
      userId,
      productId: 'prod-1',
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date('2026-10-01T00:00:00.000Z'),
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      schedules: [
        {
          id: 'sch-1',
          subscriptionId,
          dayOfWeek: DayOfWeek.WEDNESDAY,
          quantity: 2,
        },
      ],
    };

    const mockCreatedSkipDate = {
      id: 'skip-1',
      subscriptionId,
      date: new Date('2026-11-25T00:00:00.000Z'),
      reason: 'Customer not available',
      createdAt: new Date(),
    };

    it('should successfully add a skip date to an ACTIVE subscription', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockActiveSubscription);
      prisma.subscriptionSkipDate.findUnique.mockResolvedValue(null);
      prisma.subscriptionSkipDate.create.mockResolvedValue(mockCreatedSkipDate);

      const result = await service.addSkipDate(
        userId,
        subscriptionId,
        validDto,
      );

      expect(prisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        include: { schedules: true },
      });
      expect(prisma.subscriptionSkipDate.findUnique).toHaveBeenCalledWith({
        where: {
          subscriptionId_date: {
            subscriptionId,
            date: new Date('2026-11-25T00:00:00.000Z'),
          },
        },
      });
      expect(prisma.subscriptionSkipDate.create).toHaveBeenCalledWith({
        data: {
          subscriptionId,
          date: new Date('2026-11-25T00:00:00.000Z'),
          reason: 'Customer not available',
        },
      });
      expect(result).toEqual(mockCreatedSkipDate);
    });

    it('should successfully add a skip date when optional reason is omitted', async () => {
      const dtoWithoutReason: AddSkipDateDto = {
        date: '2026-11-25',
      };
      const createdWithoutReason = {
        ...mockCreatedSkipDate,
        reason: null,
      };

      prisma.subscription.findUnique.mockResolvedValue(mockActiveSubscription);
      prisma.subscriptionSkipDate.findUnique.mockResolvedValue(null);
      prisma.subscriptionSkipDate.create.mockResolvedValue(
        createdWithoutReason,
      );

      const result = await service.addSkipDate(
        userId,
        subscriptionId,
        dtoWithoutReason,
      );

      expect(prisma.subscriptionSkipDate.create).toHaveBeenCalledWith({
        data: {
          subscriptionId,
          date: new Date('2026-11-25T00:00:00.000Z'),
          reason: undefined,
        },
      });
      expect(result).toEqual(createdWithoutReason);
    });

    it('should throw NotFoundException if subscription does not exist', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);

      await expect(
        service.addSkipDate(userId, 'non-existent-sub', validDto),
      ).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );
      expect(prisma.subscriptionSkipDate.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if subscription belongs to another user', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        ...mockActiveSubscription,
        userId: 'other-user',
      });

      await expect(
        service.addSkipDate(userId, subscriptionId, validDto),
      ).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );
      expect(prisma.subscriptionSkipDate.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if subscription status is PAUSED', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        ...mockActiveSubscription,
        status: SubscriptionStatus.PAUSED,
      });

      await expect(
        service.addSkipDate(userId, subscriptionId, validDto),
      ).rejects.toThrow(
        new BadRequestException(
          SUBSCRIPTION_MESSAGES.ONLY_ACTIVE_CAN_ADD_SKIP_DATE,
        ),
      );
      expect(prisma.subscriptionSkipDate.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if subscription status is CANCELLED', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        ...mockActiveSubscription,
        status: SubscriptionStatus.CANCELLED,
      });

      await expect(
        service.addSkipDate(userId, subscriptionId, validDto),
      ).rejects.toThrow(
        new BadRequestException(
          SUBSCRIPTION_MESSAGES.ONLY_ACTIVE_CAN_ADD_SKIP_DATE,
        ),
      );
      expect(prisma.subscriptionSkipDate.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid date format or non-existent date', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockActiveSubscription);

      const invalidDateCases = [
        'invalid-date',
        '2026/11/25',
        '25-11-2026',
        '2026-1-1',
        '2026-02-31',
        '2026-13-01',
      ];

      for (const invalidDate of invalidDateCases) {
        await expect(
          service.addSkipDate(userId, subscriptionId, { date: invalidDate }),
        ).rejects.toThrow(
          new BadRequestException(SUBSCRIPTION_MESSAGES.INVALID_DATE_FORMAT),
        );
      }
      expect(prisma.subscriptionSkipDate.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if date is in the past', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockActiveSubscription);

      await expect(
        service.addSkipDate(userId, subscriptionId, { date: '2020-01-01' }),
      ).rejects.toThrow(
        new BadRequestException(SUBSCRIPTION_MESSAGES.CANNOT_SKIP_PAST_DATE),
      );
      expect(prisma.subscriptionSkipDate.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if date is before subscription start date', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        ...mockActiveSubscription,
        startDate: new Date('2026-12-01T00:00:00.000Z'),
      });

      await expect(
        service.addSkipDate(userId, subscriptionId, validDto),
      ).rejects.toThrow(
        new BadRequestException(
          SUBSCRIPTION_MESSAGES.SKIP_DATE_BEFORE_START_DATE,
        ),
      );
      expect(prisma.subscriptionSkipDate.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if date is after subscription end date', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        ...mockActiveSubscription,
        startDate: new Date('2026-10-01T00:00:00.000Z'),
        endDate: new Date('2026-11-20T00:00:00.000Z'),
      });

      await expect(
        service.addSkipDate(userId, subscriptionId, validDto),
      ).rejects.toThrow(
        new BadRequestException(SUBSCRIPTION_MESSAGES.SKIP_DATE_AFTER_END_DATE),
      );
      expect(prisma.subscriptionSkipDate.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if date does not match a scheduled delivery weekday', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        ...mockActiveSubscription,
        schedules: [
          {
            id: 'sch-1',
            subscriptionId,
            dayOfWeek: DayOfWeek.MONDAY,
            quantity: 1,
          },
        ],
      });

      await expect(
        service.addSkipDate(userId, subscriptionId, validDto),
      ).rejects.toThrow(
        new BadRequestException(SUBSCRIPTION_MESSAGES.DATE_NOT_IN_SCHEDULE),
      );
      expect(prisma.subscriptionSkipDate.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if skip date is a duplicate (existing record found)', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockActiveSubscription);
      prisma.subscriptionSkipDate.findUnique.mockResolvedValue({
        id: 'existing-skip',
        subscriptionId,
        date: new Date('2026-11-25T00:00:00.000Z'),
      });

      await expect(
        service.addSkipDate(userId, subscriptionId, validDto),
      ).rejects.toThrow(
        new BadRequestException(SUBSCRIPTION_MESSAGES.DUPLICATE_SKIP_DATE),
      );
      expect(prisma.subscriptionSkipDate.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if Prisma throws unique constraint violation (P2002) on create', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockActiveSubscription);
      prisma.subscriptionSkipDate.findUnique.mockResolvedValue(null);

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '6.19.3',
        },
      );
      prisma.subscriptionSkipDate.create.mockRejectedValue(p2002Error);

      await expect(
        service.addSkipDate(userId, subscriptionId, validDto),
      ).rejects.toThrow(
        new BadRequestException(SUBSCRIPTION_MESSAGES.DUPLICATE_SKIP_DATE),
      );
    });

    it('should allow skip date on the exact subscription start date', async () => {
      const subscriptionStartingOnDate = {
        ...mockActiveSubscription,
        startDate: new Date('2026-11-25T00:00:00.000Z'),
      };
      prisma.subscription.findUnique.mockResolvedValue(
        subscriptionStartingOnDate,
      );
      prisma.subscriptionSkipDate.findUnique.mockResolvedValue(null);
      prisma.subscriptionSkipDate.create.mockResolvedValue(mockCreatedSkipDate);

      const result = await service.addSkipDate(
        userId,
        subscriptionId,
        validDto,
      );

      expect(result).toEqual(mockCreatedSkipDate);
    });

    it('should allow skip date on the exact subscription end date', async () => {
      const subscriptionEndingOnDate = {
        ...mockActiveSubscription,
        endDate: new Date('2026-11-25T00:00:00.000Z'),
      };
      prisma.subscription.findUnique.mockResolvedValue(
        subscriptionEndingOnDate,
      );
      prisma.subscriptionSkipDate.findUnique.mockResolvedValue(null);
      prisma.subscriptionSkipDate.create.mockResolvedValue(mockCreatedSkipDate);

      const result = await service.addSkipDate(
        userId,
        subscriptionId,
        validDto,
      );

      expect(result).toEqual(mockCreatedSkipDate);
    });
  });

  describe('getSkipDates', () => {
    const userId = 'user-123';
    const subscriptionId = 'sub-1';

    const mockSubscription = {
      id: subscriptionId,
      userId,
      productId: 'prod-1',
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date('2026-10-01T00:00:00.000Z'),
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSkipDates = [
      {
        id: 'skip-1',
        subscriptionId,
        date: new Date('2026-11-25T00:00:00.000Z'),
        reason: 'Customer not available',
        createdAt: new Date('2026-11-19T10:00:00.000Z'),
      },
      {
        id: 'skip-2',
        subscriptionId,
        date: new Date('2026-12-02T00:00:00.000Z'),
        reason: 'Out of town',
        createdAt: new Date('2026-11-19T11:00:00.000Z'),
      },
    ];

    it('should return all skip dates for an ACTIVE subscription sorted by date asc', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockSubscription);
      prisma.subscriptionSkipDate.findMany.mockResolvedValue(mockSkipDates);

      const result = await service.getSkipDates(userId, subscriptionId);

      expect(prisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { id: subscriptionId },
      });
      expect(prisma.subscriptionSkipDate.findMany).toHaveBeenCalledWith({
        where: { subscriptionId },
        orderBy: { date: 'asc' },
      });
      expect(result).toEqual(mockSkipDates);
    });

    it('should allow retrieval for PAUSED subscriptions', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.PAUSED,
      });
      prisma.subscriptionSkipDate.findMany.mockResolvedValue(mockSkipDates);

      const result = await service.getSkipDates(userId, subscriptionId);

      expect(result).toEqual(mockSkipDates);
    });

    it('should allow retrieval for CANCELLED subscriptions', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      });
      prisma.subscriptionSkipDate.findMany.mockResolvedValue(mockSkipDates);

      const result = await service.getSkipDates(userId, subscriptionId);

      expect(result).toEqual(mockSkipDates);
    });

    it('should return an empty array if no skip dates exist for the subscription', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockSubscription);
      prisma.subscriptionSkipDate.findMany.mockResolvedValue([]);

      const result = await service.getSkipDates(userId, subscriptionId);

      expect(prisma.subscriptionSkipDate.findMany).toHaveBeenCalledWith({
        where: { subscriptionId },
        orderBy: { date: 'asc' },
      });
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException if subscription does not exist', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);

      await expect(
        service.getSkipDates(userId, 'non-existent-sub'),
      ).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );
      expect(prisma.subscriptionSkipDate.findMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if subscription belongs to another user', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        ...mockSubscription,
        userId: 'other-user',
      });

      await expect(
        service.getSkipDates(userId, subscriptionId),
      ).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );
      expect(prisma.subscriptionSkipDate.findMany).not.toHaveBeenCalled();
    });
  });
});
