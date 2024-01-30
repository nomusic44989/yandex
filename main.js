(function () {
	'use strict';
	function Slider (container, params) {	
		let s = {};
		let defaults = {
			marginRight: '20',			
			slidesPerGroup: 1,
			sliderClass: 'lists__item',
			slideDuplicateClass: 'lists__duplicate',
			slideActiveClass: 'lists__active',
			slideNextClass: 'lists__next',
			slidePrevClass: 'lists__prev',
			slideDuplicateActiveClass: 'lists__duplicate-active',
			slideDuplicateNextClass: 'lists__duplicate-next',
			slideDuplicatePrevClass: 'lists__duplicate-prev',

		};
		s.container = document.querySelector(container);
		s.containerList = s.container.querySelector(".lists");
		s.translate = 0;
		if(params.pagination && typeof params.pagination === 'string'){
			let paginationElement = document.querySelector(params.pagination);
			s.prevButton = paginationElement.querySelector("#prev");
			s.nextButton = paginationElement.querySelector("#next");
		}

		if(params.coinsView && typeof params.coinsView === 'string'){
			s.coinsView = document.querySelector(params.coinsView);			
		}

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

			let marginRight = params.marginRight ? params.marginRight : defaults.marginRight,
				slidesPerGroup = params.slidesPerGroup ? params.slidesPerGroup : defaults.slidesPerGroup,
				slideSize,
				slidePosition = 0,
				index = 0;

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
			for (i = s.activeIndex + 1; i < s.slides.length; i++) {
				if (s.slidesGrid[i] - s.slidesGrid[s.activeIndex] < s.size) {
					coin++;
				}
			}
		}
		
		/* slides progress */
		s.updateActiveIndex = function () {
			let translate = s.translate,
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
			s.realIndex = parseInt(s.containerListItem[s.activeIndex].attr('data-slide-index') || s.activeIndex, 10);
		};

		/* Classes */
		s.updateClasses = function () {
			s.slides.removeClass(defaults.slideActiveClass + ' ' + defaults.slideNextClass + ' ' + defaults.slidePrevClass + ' ' + defaults.slideDuplicateActiveClass + ' ' + defaults.slideDuplicateNextClass + ' ' + defaults.slideDuplicatePrevClass);
			let activeSlide = s.containerListItem[s.activeIndex];
			activeSlide.addClass(defaults.slideActiveClass);

			if (params.loop) {
				if (activeSlide.hasClass(s.params.slideDuplicateClass)) {
					s.containerList.querySelector('.' + defaults.sliderClass + ':not(.' + defaults.slideDuplicateClass + ')[data-slide-index="' + s.realIndex + '"]').addClass(defaults.slideDuplicateActiveClass);
				} else {
					s.containerList.querySelector('.' + defaults.sliderClass + '.' + defaults.slideDuplicateClass + '[data-slide-index="' + s.realIndex + '"]').addClass(defaults.slideDuplicateActiveClass);
				}				
			}

			// Следующий слайдер
			let nextSlide = activeSlide.next('.' + defaults.sliderClass).addClass(defaults.slideNextClass);
			if (params.loop && nextSlide.length === 0) {
				nextSlide = s.containerList[0];
				nextSlide.addClass(defaults.slideNextClass);
			}

			// Предыдущий слайдер
			let prevSlide = activeSlide.prev('.' + defaults.slideClass).addClass(defaults.slidePrevClass);
			if (params.loop && prevSlide.length === 0) {
					prevSlide = s.containerList[-1];
					prevSlide.addClass(defaults.slidePrevClass);
			}

			if (params.loop) {
				// Duplicate to all looped slides
				if (nextSlide.hasClass(defaults.slideDuplicateClass)) {
					s.containerList.querySelector('.' + defaults.slideClass + ':not(.' + defaults.slideDuplicateClass + ')[data-slide-index="' + nextSlide.attr('data-slide-index') + '"]').addClass(defaults.slideDuplicateNextClass);
				} else {
					s.containerList.querySelector('.' + defaults.slideClass + '.' + defaults.slideDuplicateClass + '[data-slide-index="' + nextSlide.attr('data-slide-index') + '"]').addClass(defaults.slideDuplicateNextClass);
				}
				if (prevSlide.hasClass(defaults.slideDuplicateClass)) {
					s.containerList.querySelector('.' + defaults.slideClass + ':not(.' + defaults.slideDuplicateClass + ')[data-slide-index="' + prevSlide.attr('data-slide-index') + '"]').addClass(defaults.slideDuplicatePrevClass);
				} else {
					s.containerList.querySelector('.' + defaults.slideClass + '.' + defaults.slideDuplicateClass + '[data-slide-index="' + prevSlide.attr('data-slide-index') + '"]').addClass(defaults.slideDuplicatePrevClass);
				}
			}
		}

		s.updateContainerSize();
		s.updateSlidesSize();
		

		// Pagination
		if (params.pagination) {
			let current,
				slidesPerGroup = params.slidesPerGroup ? params.slidesPerGroup : defaults.slidesPerGroup,
				total = params.loop ? Math.ceil((s.containerListItem.length * 2) / slidesPerGroup) : s.snapGrid.length;
				console.log(total);
		}
		
		s.updateActiveIndex();
		s.updateActiveIndex();

		/* DEFAULT INDEXES */
		/*
		let currentSlideIndex = 0;
		let nextSlideIndex = 1;

		let listItem = listItems[currentSlideIndex];
		let nextPicItem = listItems[nextSlideIndex];
		*/
		/* Function Click */
		/*const getItemsByIndex = () => {
			slidItem = listItems[currentSlideIndex];	
			nextslidItem = listItems[nextSlideIndex];
		};

		const switchClasses = () => {
			slidItem.classList.remove("active");
			nextslidItem.classList.add("active");
		};
		*/
		function round(a) {
			return Math.floor(a);
		}
		console.log(s);
		//return s;
	}

	window.Slider = Slider;
})();