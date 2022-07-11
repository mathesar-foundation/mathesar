# NOTE can't use python's ABC library, due to a conflict with Django models' meta classes
class Relation:
    def get_records(self, **kwargs):
        raise Exception("must be implemented by subclass")

    def sa_num_records(self, **kwargs):
        raise Exception("must be implemented by subclass")
