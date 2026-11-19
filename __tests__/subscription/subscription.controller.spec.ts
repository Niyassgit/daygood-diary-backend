import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionController } from 'src/subscription/subscription.controller';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { DayOfWeek } from '@prisma/client';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import SUBSCRIPTION_MESSAGES from 'src/common/constants/subscription.message';
import { AddSkipDateDto } from 'src/subscription/dto/add-skip-date.dto';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    getSchedule: jest.Mock;
    updateSchedule: jest.Mock;
    pause: jest.Mock;
    resume: jest.Mock;
    cancel: jest.Mock;
    addSkipDate: jest.Mock;
    getSkipDates: jest.Mock;
  };

  const mockSubscriptionService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    getSchedule: jest.fn(),
    updateSchedule: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    cancel: jest.fn(),
    addSkipDate: jest.fn(),
    getSkipDates: jest.fn(),
  };

  const mockRequest = {
    user: {
      userId: 'user-123',
      role: 'CUSTOMER',
    },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        {
          provide: SubscriptionService,
          useValue: mockSubscriptionService,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
    service = module.get(SubscriptionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to service.create with userId and dto', async () => {
      const dto = {
        productId: 'prod-1',
        startDate: '2026-10-01',
      };
      service.create.mockResolvedValue({ id: 'sub-1' });

      const result = await controller.create(mockRequest, dto);

      expect(service.create).toHaveBeenCalledWith('user-123', dto);
      expect(result).toEqual({ id: 'sub-1' });
    });
  });

  describe('findAll', () => {
    it('should delegate to service.findAll with userId', async () => {
      service.findAll.mockResolvedValue([{ id: 'sub-1' }]);

      const result = await controller.findAll(mockRequest);

      expect(service.findAll).toHaveBeenCalledWith('user-123');
      expect(result).toEqual([{ id: 'sub-1' }]);
    });
  });

  describe('findOne', () => {
    it('should delegate to service.findOne with userId and id', async () => {
      service.findOne.mockResolvedValue({ id: 'sub-1' });

      const result = await controller.findOne(mockRequest, 'sub-1');

      expect(service.findOne).toHaveBeenCalledWith('user-123', 'sub-1');
      expect(result).toEqual({ id: 'sub-1' });
    });
  });

  describe('update', () => {
    it('should delegate to service.update with userId, id and dto', async () => {
      const dto = { endDate: '2026-11-01' };
      service.update.mockResolvedValue({ id: 'sub-1' });

      const result = await controller.update(mockRequest, 'sub-1', dto);

      expect(service.update).toHaveBeenCalledWith('user-123', 'sub-1', dto);
      expect(result).toEqual({ id: 'sub-1' });
    });
  });

  describe('getSchedule', () => {
    it('should delegate to service.getSchedule with userId and id', async () => {
      service.getSchedule.mockResolvedValue([]);

      const result = await controller.getSchedule(mockRequest, 'sub-1');

      expect(service.getSchedule).toHaveBeenCalledWith('user-123', 'sub-1');
      expect(result).toEqual([]);
    });
  });

  describe('updateSchedule', () => {
    it('should delegate to service.updateSchedule with userId, id and dto', async () => {
      const dto = {
        schedule: [{ dayOfWeek: DayOfWeek.MONDAY, quantity: 2 }],
      };
      service.updateSchedule.mockResolvedValue([]);

      const result = await controller.updateSchedule(mockRequest, 'sub-1', dto);

      expect(service.updateSchedule).toHaveBeenCalledWith(
        'user-123',
        'sub-1',
        dto,
      );
      expect(result).toEqual([]);
    });
  });

  describe('pause', () => {
    it('should delegate to service.pause with userId and id', async () => {
      service.pause.mockResolvedValue({ id: 'sub-1', status: 'PAUSED' });

      const result = await controller.pause(mockRequest, 'sub-1');

      expect(service.pause).toHaveBeenCalledWith('user-123', 'sub-1');
      expect(result).toEqual({ id: 'sub-1', status: 'PAUSED' });
    });
  });

  describe('resume', () => {
    it('should delegate to service.resume with userId and id', async () => {
      service.resume.mockResolvedValue({ id: 'sub-1', status: 'ACTIVE' });

      const result = await controller.resume(mockRequest, 'sub-1');

      expect(service.resume).toHaveBeenCalledWith('user-123', 'sub-1');
      expect(result).toEqual({ id: 'sub-1', status: 'ACTIVE' });
    });
  });

  describe('cancel', () => {
    it('should delegate to service.cancel with userId and id', async () => {
      service.cancel.mockResolvedValue({ id: 'sub-1', status: 'CANCELLED' });

      const result = await controller.cancel(mockRequest, 'sub-1');

      expect(service.cancel).toHaveBeenCalledWith('user-123', 'sub-1');
      expect(result).toEqual({ id: 'sub-1', status: 'CANCELLED' });
    });
  });

  describe('getSkipDates', () => {
    it('should delegate to service.getSkipDates with userId and id', async () => {
      const mockSkipDates = [
        {
          id: 'skip-1',
          subscriptionId: 'sub-1',
          date: new Date('2026-11-25T00:00:00.000Z'),
          reason: 'Out of town',
          createdAt: new Date(),
        },
      ];
      service.getSkipDates.mockResolvedValue(mockSkipDates);

      const result = await controller.getSkipDates(mockRequest, 'sub-1');

      expect(service.getSkipDates).toHaveBeenCalledWith('user-123', 'sub-1');
      expect(result).toEqual(mockSkipDates);
    });

    it('should return empty array when no skip dates exist', async () => {
      service.getSkipDates.mockResolvedValue([]);

      const result = await controller.getSkipDates(mockRequest, 'sub-1');

      expect(service.getSkipDates).toHaveBeenCalledWith('user-123', 'sub-1');
      expect(result).toEqual([]);
    });

    it('should propagate NotFoundException when subscription is not found', async () => {
      service.getSkipDates.mockRejectedValue(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );

      await expect(
        controller.getSkipDates(mockRequest, 'non-existent'),
      ).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );
      expect(service.getSkipDates).toHaveBeenCalledWith(
        'user-123',
        'non-existent',
      );
    });

    it('should propagate NotFoundException when subscription belongs to another user', async () => {
      service.getSkipDates.mockRejectedValue(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );

      await expect(
        controller.getSkipDates(mockRequest, 'other-sub'),
      ).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );
    });
  });

  describe('addSkipDate', () => {
    const validDto: AddSkipDateDto = {
      date: '2026-11-25',
      reason: 'Customer not available',
    };

    it('should successfully add a skip date and delegate to service.addSkipDate', async () => {
      const mockResult = {
        id: 'skip-1',
        subscriptionId: 'sub-1',
        date: new Date('2026-11-25T00:00:00.000Z'),
        reason: 'Customer not available',
        createdAt: new Date(),
      };
      service.addSkipDate.mockResolvedValue(mockResult);

      const result = await controller.addSkipDate(
        mockRequest,
        'sub-1',
        validDto,
      );

      expect(service.addSkipDate).toHaveBeenCalledWith(
        'user-123',
        'sub-1',
        validDto,
      );
      expect(result).toEqual(mockResult);
    });

    it('should successfully add a skip date when optional reason is omitted', async () => {
      const dtoWithoutReason: AddSkipDateDto = {
        date: '2026-11-25',
      };
      const mockResult = {
        id: 'skip-1',
        subscriptionId: 'sub-1',
        date: new Date('2026-11-25T00:00:00.000Z'),
        reason: null,
        createdAt: new Date(),
      };
      service.addSkipDate.mockResolvedValue(mockResult);

      const result = await controller.addSkipDate(
        mockRequest,
        'sub-1',
        dtoWithoutReason,
      );

      expect(service.addSkipDate).toHaveBeenCalledWith(
        'user-123',
        'sub-1',
        dtoWithoutReason,
      );
      expect(result).toEqual(mockResult);
    });

    it('should propagate NotFoundException when subscription is not found', async () => {
      service.addSkipDate.mockRejectedValue(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );

      await expect(
        controller.addSkipDate(mockRequest, 'non-existent', validDto),
      ).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );
      expect(service.addSkipDate).toHaveBeenCalledWith(
        'user-123',
        'non-existent',
        validDto,
      );
    });

    it('should propagate NotFoundException when subscription belongs to another user', async () => {
      service.addSkipDate.mockRejectedValue(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );

      await expect(
        controller.addSkipDate(mockRequest, 'other-sub', validDto),
      ).rejects.toThrow(
        new NotFoundException(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND),
      );
    });

    it('should propagate BadRequestException when subscription is PAUSED', async () => {
      service.addSkipDate.mockRejectedValue(
        new BadRequestException(
          SUBSCRIPTION_MESSAGES.ONLY_ACTIVE_CAN_ADD_SKIP_DATE,
        ),
      );

      await expect(
        controller.addSkipDate(mockRequest, 'sub-1', validDto),
      ).rejects.toThrow(
        new BadRequestException(
          SUBSCRIPTION_MESSAGES.ONLY_ACTIVE_CAN_ADD_SKIP_DATE,
        ),
      );
    });

    it('should propagate BadRequestException when subscription is CANCELLED', async () => {
      service.addSkipDate.mockRejectedValue(
        new BadRequestException(
          SUBSCRIPTION_MESSAGES.ONLY_ACTIVE_CAN_ADD_SKIP_DATE,
        ),
      );

      await expect(
        controller.addSkipDate(mockRequest, 'sub-1', validDto),
      ).rejects.toThrow(
        new BadRequestException(
          SUBSCRIPTION_MESSAGES.ONLY_ACTIVE_CAN_ADD_SKIP_DATE,
        ),
      );
    });

    it('should propagate BadRequestException when date format is invalid', async () => {
      service.addSkipDate.mockRejectedValue(
        new BadRequestException(SUBSCRIPTION_MESSAGES.INVALID_DATE_FORMAT),
      );

      await expect(
        controller.addSkipDate(mockRequest, 'sub-1', {
          date: 'invalid-date',
        }),
      ).rejects.toThrow(
        new BadRequestException(SUBSCRIPTION_MESSAGES.INVALID_DATE_FORMAT),
      );
    });

    it('should propagate BadRequestException when date is in the past', async () => {
      service.addSkipDate.mockRejectedValue(
        new BadRequestException(SUBSCRIPTION_MESSAGES.CANNOT_SKIP_PAST_DATE),
      );

      await expect(
        controller.addSkipDate(mockRequest, 'sub-1', {
          date: '2020-01-01',
        }),
      ).rejects.toThrow(
        new BadRequestException(SUBSCRIPTION_MESSAGES.CANNOT_SKIP_PAST_DATE),
      );
    });

    it('should propagate BadRequestException when date is before subscription start date', async () => {
      service.addSkipDate.mockRejectedValue(
        new BadRequestException(
          SUBSCRIPTION_MESSAGES.SKIP_DATE_BEFORE_START_DATE,
        ),
      );

      await expect(
        controller.addSkipDate(mockRequest, 'sub-1', validDto),
      ).rejects.toThrow(
        new BadRequestException(
          SUBSCRIPTION_MESSAGES.SKIP_DATE_BEFORE_START_DATE,
        ),
      );
    });

    it('should propagate BadRequestException when date is after subscription end date', async () => {
      service.addSkipDate.mockRejectedValue(
        new BadRequestException(SUBSCRIPTION_MESSAGES.SKIP_DATE_AFTER_END_DATE),
      );

      await expect(
        controller.addSkipDate(mockRequest, 'sub-1', validDto),
      ).rejects.toThrow(
        new BadRequestException(SUBSCRIPTION_MESSAGES.SKIP_DATE_AFTER_END_DATE),
      );
    });

    it('should propagate BadRequestException when date does not match a scheduled delivery weekday', async () => {
      service.addSkipDate.mockRejectedValue(
        new BadRequestException(SUBSCRIPTION_MESSAGES.DATE_NOT_IN_SCHEDULE),
      );

      await expect(
        controller.addSkipDate(mockRequest, 'sub-1', validDto),
      ).rejects.toThrow(
        new BadRequestException(SUBSCRIPTION_MESSAGES.DATE_NOT_IN_SCHEDULE),
      );
    });

    it('should propagate BadRequestException when duplicate skip date', async () => {
      service.addSkipDate.mockRejectedValue(
        new BadRequestException(SUBSCRIPTION_MESSAGES.DUPLICATE_SKIP_DATE),
      );

      await expect(
        controller.addSkipDate(mockRequest, 'sub-1', validDto),
      ).rejects.toThrow(
        new BadRequestException(SUBSCRIPTION_MESSAGES.DUPLICATE_SKIP_DATE),
      );
    });
  });
});
