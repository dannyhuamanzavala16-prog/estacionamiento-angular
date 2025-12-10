import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuardiaHeader } from './guardia-header';

describe('GuardiaHeader', () => {
  let component: GuardiaHeader;
  let fixture: ComponentFixture<GuardiaHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuardiaHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuardiaHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
