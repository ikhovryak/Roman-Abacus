function UIElement(x, y, width, height, type, ref, subref, slotType) {
    this.x = x;
    this.y = y;
    this.x2 = x + width;
    this.y2 = y + height;
    this.type = type; // 0 = node, 1 = slot, 2 connection
    this.ref = ref;
  }
  
  function Bead() {
    this.position = [0.0, 0.0];
    this.value = 0;
    this.active = false;
    this.uniqueID = -1;
  }
  
  function AbacusCtrl(type) {
    this.type = type; // 0 Japanese, 1 Chinese
    
    this.beadLines = 7
    this.beadPerLine = (this.type == 0) ? 5 : 7;
    this.beadSep = (this.type == 0) ? 3 : 4;
    this.beadHeight = 35;
    this.beadSpacing = 80;
    this.beadWidth = 35;
    this.nodes = new Array();
    
    this.init = function() {
      this.nodes.length = 0;
      var id = 0;
      for(var i=0; i < this.beadLines; i++) {
        for(var j=0; j < this.beadPerLine; j++) {
          var bead = new Bead();
          bead.position[0] = 510 - i * this.beadSpacing;
          bead.position[1] = 100 + this.beadPerLine * this.beadHeight - j * this.beadHeight;
          bead.value = 1;
          if(j > this.beadSep) {
            bead.position[1] = 50 + this.beadPerLine * this.beadHeight - (j * this.beadHeight + 2 * this.beadHeight);
            bead.value = 5;
          }
          bead.uniqueID = id;
          this.nodes.push(bead);
          id++;
        }
      }
    };
    
    this.intToRoman = function(num) {
      // "|Ẋ|", "|Ċ|", "|Ṁ|"
      var list = ['Ṁ','ĊṀ', 'Ḋ','ĊḊ','Ċ','ẊĊ','Ḷ','ẊḶ', 'Ẋ', 'MẊ','Ṿ', 'MṾ', 'M', 'CM', 'D', 'CD','C','XC','L', 'XL','X','IX','V','IV','I']
      var valueList = [1000000, 900000, 500000, 400000, 100000, 90000, 50000, 40000, 10000,9000, 5000, 4000, 1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
      var result = ''
      while(num !== 0) {
          for(var i = 0 ; i < valueList.length ; i++) {
              if(num >= valueList[i]){
                  result += list[i]
                  num -= valueList[i]
                  break
              }
          }
      }
      return result
  };
    this.getBeadsCount = function() {
        var beadsValues = new Array();
        var totalValue = 0;
        var values = [1,10,100,1000,10000, 100000, 1000000, 10000000];
        var curLevel = 0;
        for(var i=0; i < this.nodes.length; i++){
            if(this.nodes[i].active==true){
                beadsValues.push(this.nodes[i].value);
                totalValue += (this.nodes[i].value)*values[curLevel];
            }
            else{
              beadsValues.push(0);
            };
            if((i+1)%5==0){
              curLevel = curLevel+1;
            }
        }
        console.log(totalValue);
        
        var roman = "";
        if(totalValue<4000000){
          if(totalValue==0){
            roman=" (nulla)";
          }
          else{
            roman = ' (' + this.intToRoman(totalValue) +')';

          }
        } 

        document.getElementById("total").innerHTML = totalValue + roman;

        // console.log(beadsValues);
        // console.log(this.nodes);
      return this.nodes.length;
    };
    
    this.getBeadPositionX = function(nodeId) {
      return this.nodes[nodeId].position[0];
    };
  
    this.getBeadPositionY = function(nodeId) {
      return this.nodes[nodeId].position[1];
    };
    
    this.activated = function(nodeId) {
      var line = Math.floor(nodeId / this.beadPerLine);
      var beadInLine = nodeId - line * this.beadPerLine;
      //console.log(nodeId +" " + line + " " + beadInLine);
      
      var active = this.nodes[nodeId].active;
      this.nodes[nodeId].active = !active;
      
      var dir = 1;
      if(beadInLine > this.beadSep) dir = -1;
      
      var offset = dir * (-1) * this.beadHeight ;
      if (active) offset = dir * this.beadHeight;
      this.nodes[nodeId].position[1] += offset;
      
      if (beadInLine <= this.beadSep) {
        for (var j = 0; j < this.beadPerLine; j++) {
          var n = line * this.beadPerLine + j;
          if (j <= this.beadSep && j !== beadInLine) {
            if ((!active && j > beadInLine) || (active && j < beadInLine)) {
              if (this.nodes[n].active === active) {
                this.nodes[n].position[1] += offset;
                this.nodes[n].active = !this.nodes[n].active;
              }
            }
  
          }
        }
      }else{
        for (var j = 0; j < this.beadPerLine; j++) {
          var n = line * this.beadPerLine + j;
          if (j > this.beadSep && j !== beadInLine) {
            if ((!active && j < beadInLine) || (active && j > beadInLine)) {
              if (this.nodes[n].active === active) {
                this.nodes[n].position[1] += offset;
                this.nodes[n].active = !this.nodes[n].active;
              }
            }
          }
        }
      }
    };
  }
  
  function Abacus(parentDivId, type) {
    var abacusCtrl = new  AbacusCtrl(type);
    var canvas;
    var divId = parentDivId;
    var beadColor = "rgba(255, 193, 7, 1.0)";
    var hooveredBeadColor = "rgba(255, 218, 106, 1.0)";
    var hooveredElement = -1;
    var hooveredBead = -1;
    var uiElements = new Array();
    var that = this;
    
    this.init = function() {
      
      abacusCtrl.init();
      
      canvas = document.createElement('canvas');
      if(!canvas) console.log("Abacus error: can not create a canvas element");
      canvas.id = parentDivId + "_Abacus";
      canvas.width = 40 + abacusCtrl.beadLines * abacusCtrl.beadSpacing;
      canvas.height= 90 + (abacusCtrl.beadPerLine+2) * abacusCtrl.beadHeight;
      document.body.appendChild(canvas);
      var parent = document.getElementById(divId);
      if(!parent) console.log("Abacus error: can not find an element with the given name: " + divId);
      parent.appendChild(canvas);
   
      canvas.onmousedown = function(event) {
        canvasMouseDown(event);
      };
      canvas.onmousemove = function(event) {
        canvasMouseMove(event);
      };
      canvas.onmouseup = function(event) {
        canvasMouseUp(event);
      };
      canvas.onmouseup = function(event) {
        canvasMouseUp(event);
      };
      
      this.update();
    };
  
    function drawBead(nodeId, ctx) {
  
  
        var nodePosX = abacusCtrl.getBeadPositionX(nodeId);
        var nodePosY = abacusCtrl.getBeadPositionY(nodeId);
        
        var dn = new UIElement(nodePosX, nodePosY+2, abacusCtrl.beadWidth, abacusCtrl.beadHeight-4, 0, nodeId, 0, 0);
  
        ctx.fillStyle = "rgba(204, 154, 6, 0.3)";
        drawRoundRectFilled(ctx, dn.x+4, dn.y+4, dn.x2-dn.x, dn.y2-dn.y, 30);
        ctx.fillStyle = beadColor;
       
        if(nodeId === hooveredBead) {
          ctx.fillStyle=hooveredBeadColor;
        } 
        drawRoundRectFilled(ctx, dn.x, dn.y, dn.x2-dn.x, dn.y2-dn.y, 30);
        ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
        
      uiElements.push(dn);
      if (false) {
        ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
        ctx.textAlign = 'left';
        ctx.font = '10pt sans-serif';
        ctx.fillText("ID: " + nodeId, dn.x + 4, dn.y2 - 13);
        ctx.lineWidth = 1;
      }
    }
  
    function drawBeads(ctx) {
      var count = abacusCtrl.getBeadsCount();
    //   printBeads();
      for (var i = 0; i < count; i++) {
        drawBead(i, ctx);
      }
    }


    
  
    this.update = function() {
     
      canvas.width = canvas.width;
      
      uiElements.length = 0;
      var ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#ffffff';
      
      
      // draw grid
      if (false) {
        ctx.strokeStyle = '#808080';
        var stepsX = 20.0 - 0.0;
        var stepsY = 20.0 - 0.0;
  
        var lx = 0 % stepsX;
        var ly = 0 % stepsY;
        var Lx = 0 % (stepsX * 5.0);
        if (Lx < 0.0)
          Lx += (stepsX * 5.0);
        var Ly = 0 % (stepsY * 5.0);
        if (Ly < 0.0)
          Ly += (stepsY * 5.0);
  
        while (lx < canvas.width) {
          if (Math.abs(Lx - lx) < 0.001) {
            ctx.strokeStyle = '#404040';
            Lx += (stepsX * 5.0);
          } else {
            ctx.strokeStyle = '#808080';
          }
          ctx.beginPath();
          ctx.moveTo(lx, 0);
          ctx.lineTo(lx, canvas.height);
          ctx.stroke();
          lx += stepsX;
        }
  
        while (ly < canvas.height) {
          if (Math.abs(Ly - ly) < 0.001) {
            ctx.strokeStyle = '#404040';
            Ly += (stepsY * 5.0);
          } else {
            ctx.strokeStyle = '#808080';
          }
          ctx.beginPath();
          ctx.moveTo(0, ly);
          ctx.lineTo(canvas.width, ly);
          ctx.stroke();
          ly += stepsY;
        }
      }
      // draw frame
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      for(var i=0; i < abacusCtrl.beadLines; i++) {
        var x = -30 + abacusCtrl.beadLines * abacusCtrl.beadSpacing - i * abacusCtrl.beadSpacing;
        var y = 50 + (abacusCtrl.beadPerLine+2) * abacusCtrl.beadHeight
        ctx.beginPath();
        ctx.moveTo(x, 30);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      for(var j=0; j < 2; j++) {
        var y = 20;
        if(j === 1) y = 40 + (abacusCtrl.beadPerLine - abacusCtrl.beadSep) * abacusCtrl.beadHeight;
        if(j === 2) y = 20 + (abacusCtrl.beadPerLine+2) * abacusCtrl.beadHeight;
        if(j==1){
          ctx.beginPath();
          ctx.moveTo(20, y);
          ctx.lineTo(570, y);
          ctx.stroke();
        };
        
      }
      ctx.lineWidth = 1;
      
      // draws all nodes
      drawBeads(ctx);
      
      // draw value
      ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
      ctx.textAlign = 'center';
      ctx.font = '16pt sans-serif';
      var textY = 90 + (abacusCtrl.beadPerLine+2) * abacusCtrl.beadHeight;
      for(var i=0; i < abacusCtrl.beadLines; i++) {
        var textX = -30 + abacusCtrl.beadLines * abacusCtrl.beadSpacing - i * abacusCtrl.beadSpacing;
        var valueSum = 0;
        for(var j=0; j < abacusCtrl.beadPerLine; j++) {
          var n = i * abacusCtrl.beadPerLine + j;
          if(abacusCtrl.nodes[n].active) {
            valueSum += abacusCtrl.nodes[n].value;
          }
        }
        
        var valueSting;
        if(abacusCtrl.type === 0) {
           valueSting = valueSum.toString(10);
        }else{
          valueSting = valueSum.toString(16);
        }
       
        ctx.fillText(valueSting, textX, textY);
      };

      //draw labels
      ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
      ctx.textAlign = 'center';
      ctx.font = '16pt sans-serif';
      var lables = ["I", "X", "C", "M", "Ẋ", "Ċ", "Ṁ"]
      var textY = -130 + (abacusCtrl.beadPerLine+2) * abacusCtrl.beadHeight;
      var bgLabelY = -157 + (abacusCtrl.beadPerLine+2) * abacusCtrl.beadHeight;

      console.log("yeet");
      for(var i=0; i < abacusCtrl.beadLines; i++) {
        console.log("yeet_");
        
        var textX = -30 + abacusCtrl.beadLines * abacusCtrl.beadSpacing - i * abacusCtrl.beadSpacing;
        var bgLabelX = -50 + abacusCtrl.beadLines * abacusCtrl.beadSpacing - i * abacusCtrl.beadSpacing;
        var valueSum = 0;
        for(var j=0; j < abacusCtrl.beadPerLine; j++) {
          var n = i * abacusCtrl.beadPerLine + j;
          ctx.fillStyle = "rgba(33, 36, 41, 1)";
          drawRoundRectFilled(ctx, bgLabelX, bgLabelY, 40, 40, 35);
          ctx.fillStyle = "rgba(255, 255, 255, 1)";

          ctx.fillText(lables[i], textX, textY);



        }
        
        // var valueSting;
        // if(abacusCtrl.type === 0) {
        //    valueSting = valueSum.toString(10);
        // }else{
        //   valueSting = valueSum.toString(16);
        // }
       
      };

    };
    
    function mouseOverElement(pos) {
      var selectedElement = -1;
      for (var n in uiElements) {
        if (uiElements[n].type !== 2) {
          // not of type "connection"
          if (uiElements[n].x - 1 < pos.x && 
              uiElements[n].x2 + 1 > pos.x && 
              uiElements[n].y - 1 < pos.y && 
              uiElements[n].y2 + 1 > pos.y)
          {
            selectedElement = n;
          }
        } 
      }
      return selectedElement;
    }
    
    function canvasMouseDown(event) {
      var pos = getMouse(event);
      
      // handle selection
      if (!event.altKey && event.which === 1) {
        var selectedElement = mouseOverElement(pos);
        if (selectedElement !== -1) {
          // handle node selection
          if (uiElements[selectedElement].type === 0) {
            var newSelectedBead = uiElements[selectedElement].ref;
            abacusCtrl.activated(newSelectedBead);
          }
        }
        that.update();
      } 
      event.preventDefault();
    }
  
    function canvasMouseUp(event) {
    }
  
    function canvasMouseMove(event) {
      var pos = getMouse(event);
  
      hooveredBead = -1;
      var oldHooveredElement = hooveredElement;
      hooveredElement = mouseOverElement(pos);
  
      if (hooveredElement !== -1) {
          hooveredBead = uiElements[hooveredElement].ref;
      }
      if (oldHooveredElement !== hooveredElement) that.update();
      oldPos = pos;
      event.preventDefault();
    }
  
    function getMouse(e) {
      var element = canvas;
      var offsetX = 0, offsetY = 0, mx, my;
  
      // compute the total offset
      if (element.offsetParent !== undefined) {
        do {
          offsetX += element.offsetLeft;
          offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
      }
  
      mx = e.pageX - offsetX;
      my = e.pageY - offsetY;
  
      return {x: mx, y: my};
    }
  
    function drawRoundRectFilled(ctx, x, y, width, height, radius) {
      var lineWidthBackup = ctx.lineWidth;
      var strokeStyleBackup = ctx.strokeStyle;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineJoin = "round";
      ctx.lineWidth = radius;
      ctx.strokeRect(x+(radius/2),y+(radius/2), width-radius, height-radius);
      ctx.fillRect(x+(radius/2),y+(radius/2), width-radius, height-radius);
      ctx.lineWidth = lineWidthBackup;
      ctx.strokeStyle = strokeStyleBackup;
    }
  }