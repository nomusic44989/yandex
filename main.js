(function () {
	'use strict';
	function Slider (container, params) {	
		let s = {};
		let defaults = {
			initialSlide: 0,
			marginRight: '20',			
			slidesPerGroup: 1,
			sliderClass: 'lists__item',
			slideDuplicateClass: 'lists__duplicate',
			slideActiveClass: 'lists__active',
			slideNextClass: 'lists__next',
			slidePrevClass: 'lists__prev',
			bulletClass: 'bullet__item',
			bulletsClass: 'bullets',
			slideDuplicateActiveClass: 'lists__duplicate-active',
			slideDuplicateNextClass: 'lists__duplicate-next',
			slideDuplicatePrevClass: 'lists__duplicate-prev',
			paginationCurrentClass: 'fraction-active',
			paginationTotalClass: 'fraction-total',
			buttonDisabledClass: 'btnNext__disabled',
			speed: 300,
			autoplayDisableOnInteraction: true,
			autoplayStopOnLast: false,
			// Loop
			loopedSlides: null,
			loopAdditionalSlides: 0,
		};
		s.container = document.querySelector(container);
		s.containerList = s.container.querySelector(".lists");
		s.translate = 0;
		if(params.pagination && typeof params.pagination === 'string'){
			s.paginationElement = document.querySelector(params.pagination);
			s.prevButton = s.paginationElement.querySelector("#prev");
			s.nextButton = s.paginationElement.querySelector("#next");
			s.fraction = s.paginationElement.querySelector('#fraction');

			s.bullets = s.paginationElement.querySelector('.' + defaults.bulletsClass); //Точки			
		}

		if(params.coinsView && typeof params.coinsView === 'string'){
			s.coinsView = document.querySelector(params.coinsView);			
		}

		/* Autoplay */
		s.autoplayTimeoutId = undefined;
		s.autoplaying = false;
		s.autoplayPaused = false;

		/* View window slider coin */
		s.currentViewpoint = undefined;
		s.getActiveView = function () {
			let viewPoint = false;
			let points = [], point;

			for ( point in params.view ) {
				if (params.view.hasOwnProperty(point)) {
						points.push(point);
				}
			}
			
			points.sort(function (a, b) {
					return parseInt(a, 10) < parseInt(b, 10);
			});

			for (let i = 0; i < points.length; i++) {
				point = points[i];
				if (point >= window.innerWidth && !viewPoint) {
					viewPoint = point;					
				}
			}
			
			return viewPoint || 'max';
		}
		s.setView = function () {
			//Set breakpoint for window width and update parameters
			let viewpoint = s.getActiveView();
			if (viewpoint && s.currentViewpoint !== viewpoint) {
				let breakViewParams = params.view[viewpoint];
				for (let param in breakViewParams ) {
					params[param] = breakViewParams[param];
				}
				s.currentViewpoint = viewpoint;
			}				
		};
		if (params.view) {
			s.setView();
		}

		/* Animation */
		s.autoplayTimeoutId = undefined;
		s.autoplaying = false;
		s.autoplayPaused = false;
		function autoplay() {
			let autoplayDelay = params.autoplay;
			let activeSlide = s.containerListItem[s.activeIndex];

			s.autoplayTimeoutId = setTimeout(function () {
				
				if (params.loop) {
						s.fixLoop();
						s._slideNext();
				} else {
					if (!s.isEnd) {
						s._slideNext();
					} else {
						if (!defaults.autoplayStopOnLast) {
							s._slideTo(0);
						} else {							
							s.stopAutoplay();
						}
					}
				}
			}, autoplayDelay);
		}
		s.startAutoplay = function () {			
			if (typeof s.autoplayTimeoutId !== 'undefined') return false;
			if (!params.autoplay) return false;
			if (s.autoplaying) return false;
			s.autoplaying = true;
			autoplay();
		};
		s.stopAutoplay = function (internal) {
			if (!s.autoplayTimeoutId) return;
			if (s.autoplayTimeoutId) clearTimeout(s.autoplayTimeoutId);
			s.autoplaying = false;
			s.autoplayTimeoutId = undefined;
		};
		s.pauseAutoplay = function (speed) {
			if (s.autoplayPaused) return;
			if (s.autoplayTimeoutId) clearTimeout(s.autoplayTimeoutId);
			s.autoplayPaused = true;
			if (speed === 0) {
				s.autoplayPaused = false;
				autoplay();
			} else {
				s.containerList.addEventListener('transitionend', function () {
					if (!s) return;
					s.autoplayPaused = false;
					if (!s.autoplaying) {
						s.stopAutoplay();
					} else {
						autoplay();
					}
				});
			}
		};
		s.minTranslate = function () {
			return (-s.snapGrid[0]);
		};
		s.maxTranslate = function () {
			return (-s.snapGrid[s.snapGrid.length - 1]);
		};

		/* Размеры слайда */
		s.updateContainerSize = function () {
			let width, height;
			width = s.container.clientWidth;
			height = s.container.clientHeight;

			s.width = width;
			s.height = height;
			s.size = s.width;
		}
		s.updateSlidesSize = function () {
			s.containerListItem = s.containerList.querySelectorAll('.' + defaults.sliderClass);
			s.slidesGrid = [];
			s.snapGrid = [];
			s.slidesSizesGrid = [];

			let marginRight = params.marginRight ? params.marginRight : defaults.marginRight,
				slidesPerGroup = params.slidesPerGroup ? params.slidesPerGroup : defaults.slidesPerGroup,
				slideSize,
				slidePosition = 0,
				index = 0;

			s.virtualSize = -spaceBetween;
			for (let i = 0; i < s.containerListItem.length; i++) {
				slideSize = 0;
				let slide = s.containerListItem[i];

				slideSize = (s.size - (params.sliderView - 1) * marginRight) / params.sliderView;
				slideSize = round(slideSize);

				s.containerListItem[i].style.width = slideSize + 'px';
				s.containerListItem[i].SlideSize = slideSize;
				
				if ((index) % slidesPerGroup === 0) {s.snapGrid.push(slidePosition)};
				s.slidesGrid.push(slidePosition);
				slidePosition = slidePosition + slideSize + marginRight;

				index ++;
			}
		}
		s.currentSlidesPerView = function () {
			let coin = 1;
			for (i = s.activeIndex + 1; i < s.containerListItem.length; i++) {
				if (s.slidesGrid[i] - s.slidesGrid[s.activeIndex] < s.size) {
					coin++;
				}
			}
		}
		
		/* slides progress */
		s.updateActiveIndex = function () {
			let translate = -s.translate,
				slidesPerGroup = params.slidesPerGroup ? params.slidesPerGroup : defaults.slidesPerGroup;
			let newActiveIndex, i, snapIndex;
			for (i = 0; i < s.slidesGrid.length; i ++) {
				if (typeof s.slidesGrid[i + 1] !== 'undefined') {
					if (translate >= s.slidesGrid[i] && translate < s.slidesGrid[i + 1] - (s.slidesGrid[i + 1] - s.slidesGrid[i]) / 2) {
						newActiveIndex = i;
					}
					else if (translate >= s.slidesGrid[i] && translate < s.slidesGrid[i + 1]) {
						newActiveIndex = i + 1;
					}
				}else{
					if (translate >= s.slidesGrid[i]) {
						newActiveIndex = i;
					}
				}
			}
			
			snapIndex = Math.floor(newActiveIndex / slidesPerGroup);
			if (snapIndex >= s.snapGrid.length) snapIndex = s.snapGrid.length - 1;

			if (newActiveIndex === s.activeIndex) {
				return;
			}
			s.snapIndex = snapIndex;
			s.previousIndex = s.activeIndex;
			s.activeIndex = newActiveIndex;
			s.updateClasses();
			s.updateRealIndex();
		}
		s.updateRealIndex = function(){
			s.realIndex = parseInt(s.containerListItem[s.activeIndex].getAttribute('data-slide-index') || s.activeIndex, 10);
		};

		/* Classes */
		s.updateClasses = function () {
			s.containerListItem.forEach(element => {				
				element.classList.remove(defaults.slideActiveClass, defaults.slideNextClass, defaults.slidePrevClass, defaults.slideDuplicateActiveClass, defaults.slideDuplicateNextClass, defaults.slideDuplicatePrevClass);
			});
			
			let activeSlide = s.containerListItem[s.activeIndex];
			
			activeSlide.classList.add(defaults.slideActiveClass);

			if (params.loop) {
				if (activeSlide.classList.contains(defaults.slideDuplicateClass)) {
					s.containerList.querySelector('.' + defaults.sliderClass + ':not(.' + defaults.slideDuplicateClass + ')[data-slide-index="' + s.realIndex + '"]');
					if(element) element.classList.add(defaults.slideDuplicateActiveClass);
				} else {
					let element = s.containerList.querySelector('.' + defaults.sliderClass + '.' + defaults.slideDuplicateClass + '[data-slide-index="' + s.realIndex + '"]');
					if(element) element.classList.add(defaults.slideDuplicateActiveClass);
				}				
			}

			// Следующий слайдер
			let nextSlide = activeSlide.nextElementSibling;
			if (nextSlide){
				nextSlide.classList.add(defaults.slideNextClass);
			} else if (params.loop) {
				nextSlide = s.containerListItem[0];
				nextSlide.classList.add(defaults.slideNextClass);
			}
			// Предыдущий слайдер
			let prevSlide = activeSlide.previousElementSibling;
			if (prevSlide){
				prevSlide.classList.add(defaults.slidePrevClass);
			} else if (params.loop) {
				prevSlide = s.containerListItem[s.containerListItem.length - 1];
				prevSlide.classList.add(defaults.slidePrevClass);
			}

			if (params.loop) {
				// Duplicate to all looped slides
				if (nextSlide.classList.contains(defaults.slideDuplicateClass)) {
					let elementNext = s.containerList.querySelector('.' + defaults.sliderClass + ':not(.' + defaults.slideDuplicateClass + ')[data-slide-index="' + nextSlide.getAttribute('data-slide-index') + '"]');
					if(elementNext) elementNext.classList.add(defaults.slideDuplicateNextClass);
				} else {
					let elementNext = s.containerList.querySelector('.' + defaults.sliderClass + '.' + defaults.slideDuplicateClass + '[data-slide-index="' + nextSlide.getAttribute('data-slide-index') + '"]');
					if(elementNext) elementNext.classList.add(defaults.slideDuplicateNextClass);
				}
				if (prevSlide.classList.contains(defaults.slideDuplicateClass)) {
					let element = s.containerList.querySelector('.' + defaults.sliderClass + ':not(.' + defaults.slideDuplicateClass + ')[data-slide-index="' + prevSlide.getAttribute('data-slide-index') + '"]');
					if(element) element.classList.add(defaults.slideDuplicatePrevClass);
				} else {
					let element = s.containerList.querySelector('.' + defaults.sliderClass + '.' + defaults.slideDuplicateClass + '[data-slide-index="' + prevSlide.getAttribute('data-slide-index') + '"]');
					if(element) element.classList.add(defaults.slideDuplicatePrevClass);
				}
			}
			
			// Pagination
			if (params.pagination) {
				let current,
					slidesPerGroup = params.slidesPerGroup ? params.slidesPerGroup : defaults.slidesPerGroup,
					total = params.loop ? Math.ceil((s.containerListItem.length - s.loopedSlides * 2) / slidesPerGroup) : s.snapGrid.length;
				
				if (params.loop) {
					current = Math.ceil((s.activeIndex - s.loopedSlides)/slidesPerGroup);

					if (current > s.containerListItem.length - 1 - s.loopedSlides * 2) {
							current = current - (s.containerListItem.length - s.loopedSlides * 2);
					}
					if (current > total - 1) current = current - total;
					if (current < 0 && s.bullets !== 'undefined') current = total + current;
				} else {
					if (typeof s.snapIndex !== 'undefined') {
						current = s.snapIndex;
					} else {
						current = s.activeIndex || 0;
					}
				}
				if (s.bullets && s.bullets.length > 0) {
					s.bullets.removeClass(s.params.bulletActiveClass);
					if (s.paginationContainer.length > 1) {
						s.bullets.each(function () {
							if ($(this).index() === current) $(this).addClass(s.params.bulletActiveClass);
						});
					}
					else {
						s.bullets.eq(current).addClass(s.params.bulletActiveClass);
					}
				}
				if (s.fraction) {
					let addTextCurrent = s.fraction.querySelector('.' + defaults.paginationCurrentClass);
					addTextCurrent.textContent = current + 1;
					let addTextTotal = s.fraction.querySelector('.' + defaults.paginationTotalClass);
					addTextTotal.textContent = total;
				}
			}

			if (!params.loop) {
				if (s.prevButton && s.prevButton.length > 0) {
					if (s.isBeginning) {
						s.prevButton.classList.add(defaults.buttonDisabledClass);
					} else {
						s.prevButton.classList.remove(defaults.buttonDisabledClass);
					}
				}
				if (s.nextButton && s.nextButton.length > 0) {
					if (s.isEnd) {
						s.nextButton.classList.add(defaults.buttonDisabledClass);
					} else {
						s.nextButton.classList.remove(defaults.buttonDisabledClass);
					}
				}
			}

		}	

		s.updatePagination = function () {
			if (s.paginationElement) {				
				let paginationHTML = '';
				if (s.bullets) {
					// написать точки пагинации
				}
				if (s.fraction) {
					paginationHTML =
						'<span class="' + defaults.paginationCurrentClass + '"></span>' +
						' / ' +
						'<span class="' + defaults.paginationTotalClass+'"></span>';
				
						s.fraction.innerHTML = paginationHTML;
				}
			}
		}
		s.update = function (updateTranslate) {
			if (!s) return;
			s.updateContainerSize();
			s.updateSlidesSize();
			s.updatePagination();
			s.updateClasses();

			let newTranslate;
			function forceSetTranslate() {
				let translate = s.translate;
				newTranslate = Math.min(Math.max(s.translate, s.maxTranslate()), s.minTranslate());
				s.setWrapperTranslate(newTranslate);
				s.updateActiveIndex();
				s.updateClasses();
			}

			if (updateTranslate) {
				let translated;
				translated = s.slideTo(s.activeIndex, 0, false, true);
				if (!translated) {
					forceSetTranslate();
				}
			}
		}
		// действия
		s.initEvents = function () {
			if (s.nextButton) {
				s.nextButton.addEventListener('click', s.onClickNext);				
			}
			if (s.prevButton) {
				s.prevButton.addEventListener('click', s.onClickPrev);
			}
			if (s.bullets) {
				s.bullets.addEventListener('click', '.' + defaults.bulletClass, s.onClickIndex);
				if (s.params.a11y && s.a11y) s.paginationContainer.addEventListener('keydown', '.' + s.params.bulletClass, s.a11y.onEnterKey);
			}
		}
		s.attachEvents = function () {
			s.initEvents();
		};
		s.detachEvents = function () {
			s.initEvents(true);
		};

		// Клики
		s.allowClick = true;
		s.onClickNext = function (e) {
			e.preventDefault();
			if (s.isEnd && !params.loop) return;
			s.slideNext();
		}
		s.onClickPrev = function (e) {
			e.preventDefault();
			if (s.isBeginning && !params.loop) return;
			s.slidePrev();
		};
		s.onClickIndex = function (e) {
			e.preventDefault();
			var index = Array.from(this.parentNode.children).indexOf(this) * defaults.slidesPerGroup;
			if (s.params.loop) index = index + s.loopedSlides;
			s.slideTo(index);
			var index = $(this).index() * defaults.slidesPerGroup;
			if (s.params.loop) index = index + s.loopedSlides;
			s.slideTo(index);
		};

		//Transitions
		s.slideTo = function (slideIndex, speed, runCallbacks, internal) {
			if (typeof runCallbacks === 'undefined') runCallbacks = true;
			if (typeof slideIndex === 'undefined') slideIndex = 0;
			if (slideIndex < 0) slideIndex = 0;
			s.snapIndex = Math.floor(slideIndex / defaults.slidesPerGroup);
			console.log(s.snapGrid.length );
			if (s.snapIndex >= s.snapGrid.length) s.snapIndex = s.snapGrid.length - 1;

			let translate = - s.snapGrid[s.snapIndex];
			// Stop autoplay
			if (params.autoplay && s.autoplaying) {
				if (internal || !defaults.autoplayDisableOnInteraction) {
						s.pauseAutoplay(speed);
				}
				else {
						s.stopAutoplay();
				}
			}

			// Update Index
			if (typeof speed === 'undefined') speed = defaults.speed;
			s.previousIndex = s.activeIndex || 0;
			s.activeIndex = slideIndex;
			s.updateRealIndex();

			s.updateClasses();

			
			if (speed === 0) {
				s.setWrapperTranslate(translate);
				s.setWrapperTransition(0);
				//s.onTransitionEnd(runCallbacks);
			} else {
				s.setWrapperTranslate(translate);
				s.setWrapperTransition(speed);
				if (!s.animating) {
						s.animating = true;
						s.containerList.addEventListener('transitionend', function () {
								if (!s) return;
								//s.onTransitionEnd(runCallbacks);
						});
				}
			}

				return true;
		}
		s.onTransitionStart = function (runCallbacks) {
			if (typeof runCallbacks === 'undefined') runCallbacks = true;
			if (runCallbacks) {
					s.emit('onTransitionStart', s);
					if (s.activeIndex !== s.previousIndex) {
							s.emit('onSlideChangeStart', s);
							if (s.activeIndex > s.previousIndex) {
									s.emit('onSlideNextStart', s);
							}
							else {
									s.emit('onSlidePrevStart', s);
							}
					}
	
			}
		};

		s.slideNext = function (runCallbacks, speed, internal) {
			if (params.loop) {
					if (s.animating) return false;
					s.fixLoop();
					return s.slideTo(s.activeIndex + defaults.slidesPerGroup, speed, runCallbacks, internal);
			}
			else return s.slideTo(s.activeIndex + defaults.slidesPerGroup, speed, runCallbacks, internal);
		};
		s._slideNext = function (speed) {
			return s.slideNext(true, speed, true);
		};
		s.slidePrev = function (runCallbacks, speed, internal) {
			if (params.loop) {
				if (s.animating) return false;
				s.fixLoop();
				return s.slideTo(s.activeIndex - 1, speed, runCallbacks, internal);
			}
			else return s.slideTo(s.activeIndex - 1, speed, runCallbacks, internal);
		};
		s._slidePrev = function (speed) {
			return s.slidePrev(true, speed, true);
		};

		/* Transformer */
		s.setWrapperTransition = function (duration, byController) {
			s.containerList.style.transition = duration;
			
		};
		s.setWrapperTranslate = function (translate, updateActiveIndex, byController) {
			let x = 0, y = 0, z = 0;
			x = translate;

			s.containerList.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
			s.translate = x;
		
			if (updateActiveIndex) s.updateActiveIndex();
		};
	

		/* Loop */
		s.createLoop = function () {
			// Remove duplicated slides
			let elemantChildern = s.containerList.querySelectorAll('.' + defaults.sliderClass + '.' + defaults.slideDuplicateClass);
			elemantChildern.forEach(element => {
				element.remove();
			});

			let slides = s.containerList.querySelectorAll('.' + defaults.sliderClass);
			s.loopedSlides = parseInt(defaults.loopedSlides || params.sliderView, 10);
			s.loopedSlides = s.loopedSlides + defaults.loopAdditionalSlides;
			if (s.loopedSlides > slides.length) {
				s.loopedSlides = slides.length;
			}
			
			let prependSlides = [], appendSlides = [];
			slides.forEach((el, index) => {
				let slide = el;
				if (index < s.loopedSlides) appendSlides.push(el);
				if (index < slides.length && index >= slides.length - s.loopedSlides) prependSlides.push(el);
				slide.setAttribute('data-slide-index', index);
			});
			for (let i = 0; i < appendSlides.length; i++) {
				let clonedNode = appendSlides[i].cloneNode(true);
				clonedNode.classList.add(defaults.slideDuplicateClass);
				s.containerList.appendChild(clonedNode);
			}
			for (let i = prependSlides.length - 1; i >= 0; i--) {
				let clonedNode = prependSlides[i].cloneNode(true);
				clonedNode.classList.add(defaults.slideDuplicateClass);
				s.containerList.prepend(clonedNode);
			}

		}
		s.destroyLoop = function () {
			let elemantChildern = s.containerList.querySelectorAll('.' + defaults.sliderClass + '.' + defaults.slideDuplicateClass);
			elemantChildern.forEach(element => {
				element.remove();
				element.removeAttribute('data-slide-index');
			});			
		};
		s.reLoop = function (updatePosition) {
			var oldIndex = s.activeIndex - s.loopedSlides;
			s.destroyLoop();
			s.createLoop();
			s.updateSlidesSize();
			if (updatePosition) {
					s.slideTo(oldIndex + s.loopedSlides, 0, false);
			}	
		};
		s.fixLoop = function () {
			let newIndex;
			if (s.activeIndex < s.loopedSlides) {
					newIndex = s.containerListItem.length - s.loopedSlides * 3 + s.activeIndex;
					newIndex = newIndex + s.loopedSlides;
					s.slideTo(newIndex, 0, false, true);
			} else if (s.activeIndex > s.containerListItem.length - params.sliderView * 2) {
					newIndex = -s.containerListItem.length + s.activeIndex + s.loopedSlides;
					newIndex = newIndex + s.loopedSlides;
					s.slideTo(newIndex, 0, false, true);
			}
		};

		function round(a) {
			return Math.floor(a);
		}

		s.init = function () {
			if (params.loop) s.createLoop();
			s.updateContainerSize();
			s.updateSlidesSize();
			s.updatePagination();
			if (params.loop) {
				s.slideTo(defaults.initialSlide + s.loopedSlides, 0, false);
			}else{
				s.slideTo(defaults.initialSlide, 0, false);
			}
			s.attachEvents();
			if (params.autoplay) {
				s.startAutoplay();
			}
		}

		s.init();
		console.log(s);
		return s;
	}

	window.Slider = Slider;
})();