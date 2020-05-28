define(['require', 'exports'], function (require, exports) {
  function create(ctx, createData) {
    require([createData.path]);
    const WorkerClass = self[createData.label + 'MonacoWorker'];
    return new WorkerClass(ctx, createData);
  }
  exports.create = create;
});
