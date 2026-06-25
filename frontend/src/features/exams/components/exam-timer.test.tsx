import {
  render,
  screen,
  act
} from '@testing-library/react';
import { ExamTimer } from './exam-timer';

describe('ExamTimer', () => {
  const originalTitle = document.title;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-07T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    document.title = originalTitle;
  });

  it('renders null if deadline is null', () => {
    const { container } = render(
      <ExamTimer deadline={null} serverTime="2026-06-07T12:00:00.000Z" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders countdown formatted correctly and updates document title', () => {
    const deadline = '2026-06-07T12:10:00.000Z'; // 10 minutes in the future
    const serverTime = '2026-06-07T12:00:00.000Z'; // same as system time, skew = 0

    render(
      <ExamTimer
        deadline={deadline}
        serverTime={serverTime}
        examTitle="Math 101"
      />
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(document.title).toBe('[10:00] Taking: Math 101 | Online Examination System');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('09:55')).toBeInTheDocument();
    expect(document.title).toBe('[09:55] Taking: Math 101 | Online Examination System');
  });

  it('accounts for server skew correctly', () => {
    vi.setSystemTime(new Date('2026-06-07T12:02:00.000Z')); // browser clock is ahead by 2 mins
    const serverTime = '2026-06-07T12:00:00.000Z';
    const deadline = '2026-06-07T12:05:00.000Z';

    render(
      <ExamTimer
        deadline={deadline}
        serverTime={serverTime}
        examTitle="Physics"
      />
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('applies low time warning styles when remaining time is less than 5 minutes', () => {
    const deadline = '2026-06-07T12:04:59.000Z'; // 4m 59s
    const serverTime = '2026-06-07T12:00:00.000Z';

    render(
      <ExamTimer
        deadline={deadline}
        serverTime={serverTime}
      />
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    const timerElement = screen.getByText('04:59');
    expect(timerElement).toHaveClass('text-destructive');
    expect(timerElement).toHaveClass('animate-pulse');
  });

  it('triggers onExpire and stops ticking when time expires', () => {
    const onExpireSpy = vi.fn();
    const deadline = '2026-06-07T12:00:05.000Z'; // 5 seconds in future
    const serverTime = '2026-06-07T12:00:00.000Z';

    render(
      <ExamTimer
        deadline={deadline}
        serverTime={serverTime}
        onExpire={onExpireSpy}
      />
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText('00:05')).toBeInTheDocument();
    expect(onExpireSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(onExpireSpy).toHaveBeenCalledTimes(1);
  });

  it('restores standard exam title on unmount', () => {
    const deadline = '2026-06-07T12:10:00.000Z';
    const serverTime = '2026-06-07T12:00:00.000Z';

    const { unmount } = render(
      <ExamTimer
        deadline={deadline}
        serverTime={serverTime}
        examTitle="Unmounting Exam"
      />
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(document.title).toContain('[10:00] Taking: Unmounting Exam');

    unmount();

    expect(document.title).toBe('Taking: Unmounting Exam | Online Examination System');
  });
});
