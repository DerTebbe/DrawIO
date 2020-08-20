import { TestBed, async, inject } from '@angular/core/testing';

import { RoomGuard } from './room.guard';

describe('RoomGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RoomGuard]
    });
  });

  it('should ...', inject([RoomGuard], (guard: RoomGuard) => {
    expect(guard).toBeTruthy();
  }));
});
