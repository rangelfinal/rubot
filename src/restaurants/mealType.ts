import { ChronoUnit, LocalTime } from 'js-joda';
import * as moment from 'moment';

class MealType {
  public name: string;
  public mealTime: {
    start: LocalTime.now();
    end: LocalTime.now();
  };

  constructor(name: string, startTime?, endTime?) {
    this.name = name;

    this.mealTime.start = startTime;
    this.mealTime.end = endTime;
  }

  public isActive() {
    return LocalTime.now().isAfter(this.mealTime.start) && LocalTime.now().isBefore(this.mealTime.end);
  }

  public timeToNext() {
    return LocalTime.now().until(this.mealTime.start, ChronoUnit.SECONDS);
  }
}
