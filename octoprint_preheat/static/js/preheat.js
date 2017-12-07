$(function() {
	function PreheatViewModel(parameters) {
		var self = this;
		self.settings = undefined;
		self.btnPreheat = undefined;
		self.btnPreheatIcon = undefined;
		self.btnPreheatText = undefined;
		
		self.MODE_PREHEAT = 0;
		self.MODE_COOLDOWN = 1;
		
		self.mode = self.MODE_PREHEAT;
		
		self.loginState = parameters[0];
		self.temperatureState = parameters[1];
		self.printerState = parameters[2];

		self.preheat = function() {
			$.ajax({
				url: API_BASEURL + "plugin/preheat",
				type: "POST",
				dataType: "json",
				data: JSON.stringify({
					command: "preheat"
				}),
				contentType: "application/json; charset=UTF-8",
				error: function (data, status) {
					var options = {
						title: "Preheating failed.",
						text: data.responseText,
						hide: true,
						buttons: {
							sticker: false,
							closer: true
						},
						type: "error"
					};
					
					new PNotify(options);
				}
			});
		};
		
		self.cooldown = function() {
			var targets = {};
			for (tool of Object.keys(self.temperatureState.tools())) {
				targets["tool" + tool] = 0;
			}
			
			$.ajax({
				url: API_BASEURL + "printer/tool",
				type: "POST",
				dataType: "json",
				data: JSON.stringify({
					command: "target",
					targets: targets
				}),
				contentType: "application/json; charset=UTF-8"
			});
			if (self.temperatureState.hasBed()) {
				$.ajax({
					url: API_BASEURL + "printer/bed",
					type: "POST",
					dataType: "json",
					data: JSON.stringify({
						command: "target",
						target: 0
					}),
					contentType: "application/json; charset=UTF-8"
				});
			}
		};
		
		self.btnPreheatClick = function() {
			if (self.mode == self.MODE_PREHEAT) {
				self.preheat();
			}
			if (self.mode == self.MODE_COOLDOWN) {
				self.cooldown();
			}
		}
		
		self.initializeButton = function() {
			var buttonContainer = $('#job_print')[0].parentElement;
			buttonContainer.children[0].style.width = "100%";
			buttonContainer.children[0].style.marginBottom = "10px";
			buttonContainer.children[1].style.marginLeft = "0";
			
			self.btnPreheat = document.createElement("button");
			self.btnPreheat.id = "job_preheat";
			self.btnPreheat.classList.add("btn");
			self.btnPreheat.classList.add("span4");
			self.btnPreheat.addEventListener("click", self.btnPreheatClick);
			
			self.btnPreheatIcon = document.createElement("i");
			self.btnPreheat.appendChild(self.btnPreheatIcon);
			
			self.btnPreheatText = document.createTextNode(" ");
			self.btnPreheat.appendChild(self.btnPreheatText);
			
			self.btnPreheatText.nodeValue = " Preheat";
			self.btnPreheatIcon.classList.add("fa", "fa-fire");
			
			buttonContainer.appendChild(self.btnPreheat);
		};
		
		self.anyTemperatureTarget = function() {
			if (self.temperatureState.hasBed() && self.temperatureState.bedTemp.target() != 0) {
				return true;
			}
			
			for (var i = 0; i < self.temperatureState.tools().length; i++) {
				if (self.temperatureState.tools()[i].target() != 0) {
					return true;
				}
			}
			
			return false;
		}
		
		self.updateButton = function() {
			var target = self.temperatureState.tools()[0].target();
			
			//clear button icon class list
			var btnIconClassList = self.btnPreheatIcon.classList;
			while (btnIconClassList.length > 0)
				btnIconClassList.remove(btnIconClassList.item(0));
			
			if (!self.anyTemperatureTarget()) {
				self.mode = self.MODE_PREHEAT;
				self.btnPreheat.title = "Preheats the nozzle for the loaded gcode file.";
				self.btnPreheatText.nodeValue = " Preheat";
				self.btnPreheatIcon.classList.add("fa", "fa-fire");
			} else {
				self.mode = self.MODE_COOLDOWN;
				self.btnPreheat.title = "Disables tool heating.";			
				self.btnPreheatText.nodeValue = " Cool";
				self.btnPreheatIcon.classList.add("fa", "fa-snowflake-o");
			}
			
			self.btnPreheat.disabled = !self.temperatureState.isReady()
				|| self.temperatureState.isPrinting()
				|| !self.loginState.isUser()
				|| (target == 0 && self.printerState.filename() == null);
		};
		
		self.initializeButton();		
		self.fromCurrentData = function() { self.updateButton(); };
	}
	
	OCTOPRINT_VIEWMODELS.push([
		PreheatViewModel,
		["loginStateViewModel", "temperatureViewModel", "printerStateViewModel"],
		[]
	]);
});