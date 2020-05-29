define(['require', 'exports'], function (require, exports) {
  function create(ctx, createData) {
    console.log(ctx, createData);
    require([createData.workerSrc]);
    const WorkerClass = self[createData.label + 'MonacoWorker'];
    console.log(WorkerClass);
    return new WorkerClass(ctx, createData);
  }
  exports.create = create;
});
