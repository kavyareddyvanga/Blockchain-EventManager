
        class Event {
            constructor(title, start, end) {
                this.title = title;
                this.start = start;
                this.end = end;
            }
        }

        class EventScheduler {
            constructor() {
                this.events = [];
                this.workingHours = {
                    start: '09:00',
                    end: '17:00'
                };
            }

            addEvent(event) {
                if (this.isWithinWorkingHours(event)) {
                    const conflict = this.checkConflict(event);
                    if (conflict) {
                        const recommendation = this.recommendTime(event);
                        return {
                            conflict,
                            recommendation
                        };
                    }
                    this.events.push(event);
                    this.sortEvents();
                    return {
                        success: true
                    };
                }
                return {
                    outOfHours: true
                };
            }

            sortEvents() {
                this.events.sort((a, b) => {
                    return this.timeToMinutes(a.start) - this.timeToMinutes(b.start);
                });
            }

            timeToMinutes(time) {
                const [hours, minutes] = time.split(':').map(Number);
                return hours * 60 + minutes;
            }

            minutesToTime(minutes) {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
            }

            deleteEvent(index) {
                this.events.splice(index, 1);
            }

            setWorkingHours(start, end) {
                this.workingHours.start = start;
                this.workingHours.end = end;
            }

            isWithinWorkingHours(event) {
                const eventStart = this.timeToMinutes(event.start);
                const eventEnd = this.timeToMinutes(event.end);
                const workStart = this.timeToMinutes(this.workingHours.start);
                const workEnd = this.timeToMinutes(this.workingHours.end);

                return eventStart >= workStart && eventEnd <= workEnd;
            }

            checkConflict(newEvent) {
                const newStart = this.timeToMinutes(newEvent.start);
                const newEnd = this.timeToMinutes(newEvent.end);

                for (const event of this.events) {
                    const existingStart = this.timeToMinutes(event.start);
                    const existingEnd = this.timeToMinutes(event.end);

                    if ((newStart >= existingStart && newStart < existingEnd) ||
                        (newEnd > existingStart && newEnd <= existingEnd) ||
                        (newStart <= existingStart && newEnd >= existingEnd)) {
                        return event;
                    }
                }

                return null;
            }

            recommendTime(event) {
                const duration = this.timeToMinutes(event.end) - this.timeToMinutes(event.start);
                let startTime = this.timeToMinutes(this.workingHours.start);
                const endWorkingTime = this.timeToMinutes(this.workingHours.end);

                while (startTime + duration <= endWorkingTime) {
                    const potentialEvent = {
                        start: this.minutesToTime(startTime),
                        end: this.minutesToTime(startTime + duration)
                    };

                    if (!this.checkConflict(potentialEvent)) {
                        return potentialEvent;
                    }

                    startTime += 15; // Check every 15 minutes
                }

                return null; // No available time slot found
            }
        }

        const scheduler = new EventScheduler();

        document.addEventListener('DOMContentLoaded', () => {
            const addEventButton = document.getElementById('addEventButton');
            const setHoursButton = document.getElementById('setHoursButton');
            const eventTitleInput = document.getElementById('eventTitle');
            const startTimeInput = document.getElementById('startTime');
            const endTimeInput = document.getElementById('endTime');
            const workStartInput = document.getElementById('workStart');
            const workEndInput = document.getElementById('workEnd');
            const eventsList = document.getElementById('eventsList');

            addEventButton.addEventListener('click', () => {
                const title = eventTitleInput.value;
                const start = startTimeInput.value;
                const end = endTimeInput.value;

                if (!title || !start || !end) {
                    alert('Please fill in all fields');
                    return;
                }

                if (end <= start) {
                    alert('End time must be after start time');
                    return;
                }

                const event = new Event(title, start, end);
                const result = scheduler.addEvent(event);

                if (result.success) {
                    updateUI();
                    clearForm();
                } else if (result.outOfHours) {
                    alert('Event is outside working hours');
                } else if (result.conflict) {
                    const conflictingEvent = result.conflict;
                    const recommendation = result.recommendation;
                    let message = `There is a conflict with the event "${conflictingEvent.title}" scheduled from ${conflictingEvent.start} to ${conflictingEvent.end}.`;

                    if (recommendation) {
                        message += `\n\nRecommended time slot: ${recommendation.start} to ${recommendation.end}`;
                        message += '\n\nWould you like to schedule the event at the recommended time?';

                        if (confirm(message)) {
                            event.start = recommendation.start;
                            event.end = recommendation.end;
                            scheduler.addEvent(event);
                            updateUI();
                            clearForm();
                        }
                    } else {
                        message += '\n\nNo available time slots found within working hours.';
                        alert(message);
                    }
                }
            });

            setHoursButton.addEventListener('click', () => {
                const start = workStartInput.value;
                const end = workEndInput.value;

                if (!start || !end) {
                    alert('Please set both start and end working hours');
                    return;
                }

                if (end <= start) {
                    alert('End time must be after start time');
                    return;
                }

                scheduler.setWorkingHours(start, end);
                alert(`Working hours set to: ${start} - ${end}`);
            });

            function updateUI() {
                eventsList.innerHTML = '';

                scheduler.events.forEach((event, index) => {
                    const li = document.createElement('li');
                    li.className = 'event-item';
                    li.innerHTML = `
                        <div>
                            <strong>${event.title}</strong>
                            <span class="event-time">${event.start} - ${event.end}</span>
                        </div>
                        <button class="delete-button" data-index="${index}">Delete</button>
                    `;
                    eventsList.appendChild(li);
                });

                // Add event listeners to delete buttons
                document.querySelectorAll('.delete-button').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const index = parseInt(e.target.getAttribute('data-index'));
                        deleteEvent(index);
                    });
                });
            }

            function deleteEvent(index) {
                scheduler.deleteEvent(index);
                updateUI();
            }

            function clearForm() {
                eventTitleInput.value = '';
                startTimeInput.value = '';
                endTimeInput.value = '';
            }
        });
  