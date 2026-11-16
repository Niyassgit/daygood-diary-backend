import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from 'src/subscription/subscription.controller';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { DayOfWeek } from '@prisma/client';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    getSchedule: jest.Mock;
    updateSchedule: jest.Mock;
  };

  const mockSubscriptionService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    getSchedule: jest.fn(),
    updateSchedule: jest.fn(),
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
});
