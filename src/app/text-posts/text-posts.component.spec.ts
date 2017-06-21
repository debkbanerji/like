import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextPostsComponent } from './text-posts.component';

describe('TextPostsComponent', () => {
  let component: TextPostsComponent;
  let fixture: ComponentFixture<TextPostsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextPostsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextPostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
