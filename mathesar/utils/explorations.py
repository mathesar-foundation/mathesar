from mathesar.models.base import Explorations


def get_explorations(database_id):
    return Explorations.objects.filter(database__id=database_id)


def delete_exploration(exploration_id):
    Explorations.objects.get(id=exploration_id).delete()
