define(['require', 'exports'], function (require, exports) {
  function create(ctx, createData) {
    require([createData.workerSrc]);
    const WorkerClass = self[createData.label + 'MonacoWorker'];
    return new WorkerClass(ctx, createData);
  }
  exports.create = create;
});
