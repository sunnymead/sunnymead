(function () {
  'use strict';

  angular
    .module('app')
    .controller('ResultController', ResultController);

  ResultController.$inject = [
    '$scope', '$ionicHistory', 'UserRepository', 'ResultRepository', 'Types',
    '$localStorage', '$state', '$ionicPopup', '$ionicModal', '$ionicLoading',
    '$document', 'Config', 'PDFCreatorService'
  ];

  function ResultController(
    $scope, $ionicHistory, UserRepository, ResultRepository, Types,
    $localStorage, $state, $ionicPopup, $ionicModal, $ionicLoading, $http,
    $document, Config, PDFCreatorService
  ) {
    var vm = this;
    
    vm.result = ResultRepository.get();
    
    vm.showQuizStartPopup = function () {
      $ionicPopup.alert({
        title: 'Como responder o questionário',
        template: '<p>Para que o teste tenha seu maior nível de precisão não é necessário pensar muito, responda com a primeira coisa que passar pela sua cabeça, mas com sinceridade.</p>',
        okType: 'button-positive'
      });
    };
    
    if (!vm.result) { return; }
    
    vm.user = UserRepository.get();
    
    $ionicModal.fromTemplateUrl('templates/pdf.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      vm.modal = modal;
    });
    
    vm.chartOptions = {
      tooltipTemplate: function(v) { return v.value; },
      scaleOverride: true,
      scaleSteps: 5,
      scaleStepWidth: 1,
      scaleStartValue: 0
    };
    
    vm.chartOptionsFull = {
      tooltipTemplate: function(v) { return v.value; },
      responsive: false,
      scaleOverride: true,
      scaleSteps: 5,
      scaleStepWidth: 1,
      scaleStartValue: 0,
      animation: false
    };
    
    vm.chartLabels = vm.result.totals.sort(function (left, right) { return left.type - right.type; });
    vm.chartLabels.unshift(vm.chartLabels.pop());
    vm.chartLabels = vm.chartLabels.map(function (item) { return item.type; });
      
    vm.chartLabelsFull = vm.result.totals.sort(function (left, right) { return left.type - right.type; });
    vm.chartLabelsFull.unshift(vm.chartLabelsFull.pop());
    vm.chartLabelsFull = vm.chartLabelsFull.map(function (item) { return 'Tipo ' + item.type + ' - ' + item.total + ' pts'; });
    
    vm.chartData = vm.result.totals.sort(function (left, right) { return left.type - right.type; });
    vm.chartData.unshift(vm.chartData.pop());
    vm.chartData = [vm.chartData.map(function (item) { return item.total; })];
    
    vm.currentDetailModal = null;
    
    vm.openTypeDetailModal = function (type) {
      if (vm.currentDetailModal) {
        return;
      }
      
      vm.currentDetailModal = $ionicModal
        .fromTemplateUrl('templates/type_' + type + '_detail.html', {
          scope: $scope,
          animation: 'slide-in-up'
        });
        
      vm.currentDetailModal
        .then(function(modal) {
          vm.currentDetailModal = modal;
          vm.currentDetailModal.show();
        });
    };
    
    vm.closeDetailModal = function () {
      if (vm.currentDetailModal && vm.currentDetailModal.hide) {
        vm.currentDetailModal.hide();
        vm.currentDetailModal = null;
      }
    };
    
    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });
    
    $scope.$on('modal.hidden', function() {
      $scope.modal.remove();
    });
    
    $scope.$on('modal.removed', function() {
      vm.currentDetailModal = null;
    });
    
    vm.openPdfModal = function () {
      vm.modal.show();
    };
    
    vm.closePdfModal = function () {
      vm.modal.hide();
    };
    
    vm.savePdf = function () {
      vm.result.graphImageURL = document.querySelector('#hidden-radar').toDataURL();
      vm.result.user = vm.user;
      PDFCreatorService.create(vm.result);
    };
    
    vm.cleanStorage = function () {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Excluir questionário',
        template: '<p>Ao <b>excluir</b> o questionário atual será possível realizá-lo novamente.</p>' + 
                  '<p>Porém, o questionário excluido <b>não poderá ser restaurado</b></p>' +
                  '<p>Você realmente tem certeza que deseja continuar?</p>',
        buttons: [
          { text: '<b>Cancelar</b>' },
          {
            text: 'Confirmar',
            type: 'button-assertive',
            onTap: function() { return true; }
          }
        ]
      });
    
      confirmPopup.then(function(res) {
        if(!res) {
          return;
        }
        
        $localStorage.$reset();
        
        $ionicHistory.removeBackView();
        $ionicHistory.clearHistory();
        $state.go('app.result', {}, { reload: true });
      });
    };
  }

})();
