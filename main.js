(function () {
	'use strict';
	let $;
	function Slider (container, params) {	
		let s = document.querySelector(container);
		let list = s.querySelector(".lists");

		if(params.pagination && typeof params.pagination === 'string'){
			let paginationElement = document.querySelector(params.pagination);
			let buttonPrev = paginationElement.querySelector("#prev");
			let buttonNext = paginationElement.querySelector("#next");
		}

		if(params.dots && typeof params.dots === 'string'){
			let dots = document.querySelector(params.dots);
		}

		// Делаем копию 
		let listItems = list.children;
		const addClonesToEnd = (clonesNumber, itemsList) => {
			for (let i = 0; i < clonesNumber; i++) {
				let cloneItem = itemsList[i].cloneNode(true);
				cloneItem.classList.remove("active");
				itemsList[i].parentNode.appendChild(cloneItem);
			}
		};
		addClonesToEnd(3, listItems);

		/* DEFAULT INDEXES */
		let currentSlideIndex = 0;
		let nextSlideIndex = 1;

		let listItem = listItems[currentSlideIndex];
		let nextPicItem = listItems[nextSlideIndex];

		/* Function Click */
		const getItemsByIndex = () => {
			slidItem = listItems[currentSlideIndex];	
			nextslidItem = listItems[nextSlideIndex];
		};

		const switchClasses = () => {
			slidItem.classList.remove("active");
			nextslidItem.classList.add("active");
		};

		console.log(nextPicItem);
		//return s;
	}

	window.Slider = Slider;
})();